using System.Security.Cryptography;
using System.Text;

namespace ParentCommitteeAPI.Auth
{
    /*
      FieldEncryption — הצפנת שדות רגישים במנוחה (encryption at rest).

      למה: מסד הנתונים הוא קובץ יחיד על דיסק בענן. מי שמשיג עותק שלו — גיבוי
      שדלף, גישה לחשבון הענן, או טעות בהרשאות — רואה את התוכן כמו שהוא.
      ההצפנה כאן אומרת שגם במקרה כזה השדות הרגישים ביותר נשארים בלתי קריאים
      בלי המפתח, שאינו נמצא במסד אלא במשתני הסביבה.

      מה מוצפן: אלרגיות (מידע רפואי), כתובת מגורים, וטלפוני/מיילי ההורים.
      מה לא: שם ושם משפחה — הם מוצגים, ממוינים ומחופשים בכל מסך, והצפנתם
      הייתה שוברת חיפוש ומיון בלי להוסיף הגנה משמעותית (השם ממילא מופיע בכל
      תצוגה). זו הבחנה מודעת, לא השמטה.

      אלגוריתם: AES-256-GCM — הצפנה + אימות שלמות באותה פעולה, כך שגם שינוי
      של ערך מוצפן במסד מזוהה ולא מפוענח בשקט. לכל ערך nonce אקראי משלו.

      פורמט השמירה: "enc:v1:<base64 של nonce+tag+ciphertext>".
      הקידומת מאפשרת לזהות מה כבר מוצפן, כך שנתונים קיימים (לא מוצפנים)
      ממשיכים להיקרא כרגיל — אין צורך בהמרה חד-פעמית מסוכנת של המסד.

      מפתח: Encryption:Key במשתני הסביבה (base64 של 32 בייטים).
      **בלי מפתח ההצפנה כבויה** והשדות נשמרים כטקסט, כמו היום — כדי שסביבת
      פיתוח תעבוד בלי הגדרה, ושהפעלה בייצור תהיה הוספת משתנה אחד.
    */
    public static class FieldEncryption
    {
        private const string Prefix = "enc:v1:";
        private const int NonceSize = 12;  // הגודל התקני ל-GCM
        private const int TagSize = 16;

        /* המפתח נטען פעם אחת; null = הצפנה כבויה. */
        private static byte[]? _key;
        private static bool _loaded;

        public static void Configure(IConfiguration config)
        {
            var raw = config["Encryption:Key"];
            if (string.IsNullOrWhiteSpace(raw))
            {
                _key = null;
                _loaded = true;
                return;
            }
            try
            {
                var bytes = Convert.FromBase64String(raw.Trim());
                if (bytes.Length != 32)
                {
                    throw new InvalidOperationException(
                        "Encryption:Key חייב להיות 32 בייטים (base64). " +
                        "אפשר לייצר כך: openssl rand -base64 32");
                }
                _key = bytes;
            }
            catch (FormatException)
            {
                throw new InvalidOperationException(
                    "Encryption:Key אינו base64 תקין. אפשר לייצר כך: openssl rand -base64 32");
            }
            _loaded = true;
        }

        public static bool IsEnabled => _loaded && _key != null;

        /* האם הערך כבר מוצפן (כדי לא להצפין פעמיים). */
        public static bool IsEncrypted(string? value) =>
            value != null && value.StartsWith(Prefix, StringComparison.Ordinal);

        /*
          מצפין ערך. מחזיר אותו כמו שהוא אם ההצפנה כבויה, אם הוא ריק, או אם
          הוא כבר מוצפן — כך שהקריאה בטוחה מכל מקום.
        */
        public static string Protect(string? value)
        {
            var plain = value ?? string.Empty;
            if (!IsEnabled || plain.Length == 0 || IsEncrypted(plain))
            {
                return plain;
            }

            var nonce = RandomNumberGenerator.GetBytes(NonceSize);
            var plainBytes = Encoding.UTF8.GetBytes(plain);
            var cipher = new byte[plainBytes.Length];
            var tag = new byte[TagSize];

            using var aes = new AesGcm(_key!, TagSize);
            aes.Encrypt(nonce, plainBytes, cipher, tag);

            // nonce + tag + ciphertext בבלוק אחד, כדי לשמור שדה יחיד במסד
            var packed = new byte[NonceSize + TagSize + cipher.Length];
            Buffer.BlockCopy(nonce, 0, packed, 0, NonceSize);
            Buffer.BlockCopy(tag, 0, packed, NonceSize, TagSize);
            Buffer.BlockCopy(cipher, 0, packed, NonceSize + TagSize, cipher.Length);
            return Prefix + Convert.ToBase64String(packed);
        }

        /*
          מפענח ערך. ערך שאינו מוצפן מוחזר כמו שהוא — כך רשומות שנוצרו לפני
          הפעלת ההצפנה ממשיכות לעבוד.

          כשל פענוח (מפתח שהוחלף, ערך שנפגם) מחזיר מחרוזת ריקה ולא זורק:
          מסך שמציג תלמיד לא אמור לקרוס בגלל שדה אחד. אובדן קריאוּת של שדה
          בודד עדיף על נפילת המערכת.
        */
        public static string Unprotect(string? value)
        {
            var stored = value ?? string.Empty;
            if (!IsEncrypted(stored))
            {
                return stored;
            }
            if (!IsEnabled)
            {
                // יש נתון מוצפן אבל אין מפתח — לא מציגים "זבל" למשתמשת
                return string.Empty;
            }

            try
            {
                var packed = Convert.FromBase64String(stored[Prefix.Length..]);
                if (packed.Length < NonceSize + TagSize)
                {
                    return string.Empty;
                }
                var nonce = packed[..NonceSize];
                var tag = packed[NonceSize..(NonceSize + TagSize)];
                var cipher = packed[(NonceSize + TagSize)..];
                var plain = new byte[cipher.Length];

                using var aes = new AesGcm(_key!, TagSize);
                aes.Decrypt(nonce, cipher, tag, plain);
                return Encoding.UTF8.GetString(plain);
            }
            catch
            {
                return string.Empty;
            }
        }
    }
}
