using System.Security.Cryptography;
using System.Text;
using System.Xml.Linq;
using NPOI.POIFS.FileSystem;

namespace ParentCommitteeAPI.Services
{
    /*
      OfficeDecryptor — פענוח קובץ Excel (xlsx) נעול בסיסמה, בצד השרת.

      למה כאן ולא בדפדפן: ניסיון לפענח בצד הלקוח (ספריית officecrypto-tool + craco)
      הפיל את כל האפליקציה. בשרת זה מבודד ובטוח. משתמשים ב-NPOI רק לקריאת מבנה ה-OLE
      (חילוץ הזרמים EncryptionInfo ו-EncryptedPackage), ומבצעים את הצפנת ECMA-376
      Agile ידנית עם ספריית ההצפנה המובנית של .NET (אמין, בלי תלות שבירה).

      מחזיר null אם הסיסמה שגויה; זורק אם הפורמט אינו נתמך/פגום.
    */
    public static class OfficeDecryptor
    {
        // מפתחות-בלוק קבועים מהמפרט (ECMA-376 Agile)
        private static readonly byte[] BlkVerifierInput = { 0xfe, 0xa7, 0xd2, 0x76, 0x3b, 0x4b, 0x9e, 0x79 };
        private static readonly byte[] BlkVerifierValue = { 0xd7, 0xaa, 0x0f, 0x6d, 0x30, 0x61, 0x34, 0x4e };
        private static readonly byte[] BlkKeyValue = { 0x14, 0x6e, 0x0b, 0xe7, 0xab, 0xac, 0xd0, 0xd6 };

        /* מקבל את בייטים של הקובץ הנעול ואת הסיסמה, ומחזיר xlsx פתוח (או null אם הסיסמה שגויה). */
        public static byte[]? Decrypt(byte[] fileBytes, string password)
        {
            byte[] encInfo, encPackage;
            using (var input = new MemoryStream(fileBytes))
            {
                var poifs = new POIFSFileSystem(input);
                encInfo = ReadStream(poifs.Root, "EncryptionInfo");
                encPackage = ReadStream(poifs.Root, "EncryptedPackage");
            }
            return DecryptAgile(encInfo, encPackage, password);
        }

        private static byte[] ReadStream(DirectoryNode root, string name)
        {
            using var s = root.CreateDocumentInputStream(name);
            using var ms = new MemoryStream();
            s.CopyTo(ms);
            return ms.ToArray();
        }

        private static byte[]? DecryptAgile(byte[] encInfo, byte[] encPackage, string password)
        {
            // 8 בייטים ראשונים = כותרת גרסה; אחריהם XML (UTF-8)
            var xml = XDocument.Parse(Encoding.UTF8.GetString(encInfo, 8, encInfo.Length - 8));
            XNamespace ns = "http://schemas.microsoft.com/office/2006/encryption";
            XNamespace p = "http://schemas.microsoft.com/office/2006/keyEncryptor/password";

            var keyData = xml.Root!.Element(ns + "keyData")!;
            var kdSalt = Convert.FromBase64String(keyData.Attribute("saltValue")!.Value);
            int kdBlockSize = int.Parse(keyData.Attribute("blockSize")!.Value);

            var ek = xml.Root!.Element(ns + "keyEncryptors")!
                .Element(ns + "keyEncryptor")!.Element(p + "encryptedKey")!;
            int spinCount = int.Parse(ek.Attribute("spinCount")!.Value);
            int keyBits = int.Parse(ek.Attribute("keyBits")!.Value);
            int hashSize = int.Parse(ek.Attribute("hashSize")!.Value);
            var salt = Convert.FromBase64String(ek.Attribute("saltValue")!.Value);
            var encVerInput = Convert.FromBase64String(ek.Attribute("encryptedVerifierHashInput")!.Value);
            var encVerValue = Convert.FromBase64String(ek.Attribute("encryptedVerifierHashValue")!.Value);
            var encKeyValue = Convert.FromBase64String(ek.Attribute("encryptedKeyValue")!.Value);
            int keyBytes = keyBits / 8;
            // אלגוריתם הגיבוב האמיתי מהקובץ (SHA512/SHA384/SHA256/SHA1) — לא מקובע!
            // זו הסיבה ש"סיסמה נכונה" נדחתה: קבצים מסוימים מוצפנים ב-SHA1, לא SHA512.
            string ekHash = ek.Attribute("hashAlgorithm")?.Value ?? "SHA512";
            string kdHash = keyData.Attribute("hashAlgorithm")?.Value ?? ekHash;

            // גזירת גיבוב הסיסמה: Hash(salt + UTF16LE(password)), ואז spinCount איטרציות
            byte[] h = Hash(ekHash, Concat(salt, Encoding.Unicode.GetBytes(password)));
            for (int i = 0; i < spinCount; i++)
                h = Hash(ekHash, Concat(BitConverter.GetBytes(i), h));

            // אימות סיסמה
            var kIn = DeriveKey(ekHash, h, BlkVerifierInput, keyBytes);
            var verifier = AesCbc(kIn, salt, encVerInput);
            var kVal = DeriveKey(ekHash, h, BlkVerifierValue, keyBytes);
            var verifierHash = AesCbc(kVal, salt, encVerValue);
            if (!Hash(ekHash, verifier).Take(hashSize).SequenceEqual(verifierHash.Take(hashSize)))
                return null; // סיסמה שגויה

            // חילוץ מפתח החבילה ופענוח החבילה בסגמנטים של 4096 בייט
            var secretKey = AesCbc(DeriveKey(ekHash, h, BlkKeyValue, keyBytes), salt, encKeyValue).Take(keyBytes).ToArray();
            long totalSize = BitConverter.ToInt64(encPackage, 0);
            using var outMs = new MemoryStream();
            int offset = 8, segment = 0;
            while (offset < encPackage.Length)
            {
                int chunk = Math.Min(4096, encPackage.Length - offset);
                var iv = Hash(kdHash, Concat(kdSalt, BitConverter.GetBytes(segment))).Take(kdBlockSize).ToArray();
                var slice = new byte[chunk];
                Array.Copy(encPackage, offset, slice, 0, chunk);
                var dec = AesCbc(secretKey, iv, slice);
                outMs.Write(dec, 0, dec.Length);
                offset += chunk;
                segment++;
            }
            var all = outMs.ToArray();
            return all.Take((int)totalSize).ToArray();
        }

        private static byte[] DeriveKey(string alg, byte[] pwHash, byte[] blockKey, int keyBytes)
        {
            var hash = Hash(alg, Concat(pwHash, blockKey));
            var key = new byte[keyBytes];
            if (hash.Length >= keyBytes)
            {
                Array.Copy(hash, key, keyBytes);
            }
            else
            {
                Array.Copy(hash, key, hash.Length);
                for (int i = hash.Length; i < keyBytes; i++) key[i] = 0x36; // מילוי לפי המפרט
            }
            return key;
        }

        private static byte[] AesCbc(byte[] key, byte[] iv, byte[] data)
        {
            using var aes = Aes.Create();
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.None;
            aes.Key = key;
            var iv16 = new byte[16];
            Array.Copy(iv, iv16, Math.Min(iv.Length, 16));
            aes.IV = iv16;
            using var dec = aes.CreateDecryptor();
            int rem = data.Length % 16;
            if (rem != 0)
            {
                var padded = new byte[data.Length + (16 - rem)];
                Array.Copy(data, padded, data.Length);
                data = padded;
            }
            return dec.TransformFinalBlock(data, 0, data.Length);
        }

        /* גיבוב לפי האלגוריתם שצוין בקובץ (ברירת מחדל SHA512). */
        private static byte[] Hash(string alg, byte[] data)
        {
            using HashAlgorithm h = Normalize(alg) switch
            {
                "SHA1" => SHA1.Create(),
                "SHA256" => SHA256.Create(),
                "SHA384" => SHA384.Create(),
                _ => SHA512.Create(),
            };
            return h.ComputeHash(data);
        }

        private static string Normalize(string alg) =>
            (alg ?? string.Empty).Replace("-", string.Empty).Replace("_", string.Empty).ToUpperInvariant();

        private static byte[] Concat(params byte[][] arr)
        {
            var res = new byte[arr.Sum(a => a.Length)];
            int o = 0;
            foreach (var a in arr) { Array.Copy(a, 0, res, o, a.Length); o += a.Length; }
            return res;
        }
    }
}
