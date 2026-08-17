using System.Security.Cryptography;
using System.Text;

namespace ParentCommitteeAPI.Auth
{
    /*
      SecureToken — יצירה והשוואה של אסימונים אקראיים שהמערכת מייצרת בעצמה
      (מזהה אתגר התחברות, אסימון "זכור מכשיר", קודי גיבוי).

      למה לא PasswordHasher: PBKDF2 קיים כדי להאט תוקף שמנחש **סוד חלש** שאדם
      בחר — סיסמה או קוד בן 6 ספרות. האסימונים כאן אקראיים באורך 256 ביט, ואין
      מה להאט בניחוש שלהם. חשוב מכך: PBKDF2 מגריל מלח חדש בכל גיבוב, ולכן אי
      אפשר לחפש לפיו במסד — היינו נאלצים לסרוק שורות ולגבב כל אחת בנפרד.
      SHA-256 דטרמיניסטי מאפשר חיפוש ישיר, וההשוואה נעשית בזמן קבוע.

      הכלל: אסימון שהמערכת הגרילה → כאן. סוד שאדם הקליד → PasswordHasher.
    */
    public static class SecureToken
    {
        private const int DefaultBytes = 32;   // 256 ביט

        /* אסימון אקראי לשימוש בכתובות ובכותרות (Base64 ידידותי ל-URL). */
        public static string Create(int bytes = DefaultBytes)
        {
            var raw = RandomNumberGenerator.GetBytes(bytes);
            return Convert.ToBase64String(raw)
                .Replace('+', '-').Replace('/', '_').TrimEnd('=');
        }

        /*
          קוד גיבוי בפורמט XXXX-XXXX. האלפבית מדלג על 0/O/1/I/L כדי שלא תהיה
          התלבטות בהקלדה מדף מודפס — קוד גיבוי מוקלד ידנית ברגע לחוץ.
          32 תווים בכל אחת מ-8 עמדות ≈ 40 ביט, יותר מדי לניחוש.
        */
        private const string CodeAlphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

        public static string CreateBackupCode()
        {
            var chars = new char[9];
            for (var i = 0; i < 9; i++)
            {
                if (i == 4)
                {
                    chars[i] = '-';
                    continue;
                }
                chars[i] = CodeAlphabet[RandomNumberGenerator.GetInt32(CodeAlphabet.Length)];
            }
            return new string(chars);
        }

        /*
          טביעת האצבע שנשמרת במסד במקום האסימון עצמו. דטרמיניסטית, ולכן
          אפשר לחפש לפיה. מי שישיג עותק של המסד לא יוכל להפוך אותה לאסימון.
        */
        public static string Fingerprint(string token)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token.Trim()));
            return Convert.ToBase64String(hash);
        }

        /*
          טביעת אצבע של קוד גיבוי שהוקלד ידנית. רווחים ואותיות קטנות לא אמורים
          להכשיל מישהו שמקליד קוד מדף מודפס, ולכן מנרמלים לפני הגיבוב.
          מופרד מ-Fingerprint בכוונה: אסימוני מכונה הם Base64 תלוי-רישיות,
          והעלאתם לאותיות גדולות הייתה מוחקת חלק מהאקראיות שלהם.
        */
        public static string FingerprintCode(string code) =>
            Fingerprint(code.Replace(" ", string.Empty).ToUpperInvariant());

        /* השוואה בזמן קבוע — לא מדליפה כמה תווים התאימו. */
        public static bool Matches(string token, string storedFingerprint)
        {
            if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(storedFingerprint))
            {
                return false;
            }
            var actual = Encoding.UTF8.GetBytes(Fingerprint(token));
            var expected = Encoding.UTF8.GetBytes(storedFingerprint);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
    }
}
