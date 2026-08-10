namespace ParentCommitteeAPI.Auth
{
    /*
      PasswordPolicy — כלל הסיסמה של המערכת, במקום אחד.

      עד היום המינימום בשרת היה 6 תווים, כלומר `123456` התקבל. בצד הלקוח יש מד
      חוזק, אבל הוא המלצה בלבד — מי שפונה ישירות ל-API עוקף אותו. אחרי שנוספה
      הגבלת קצב על הכניסה, החולשה שנשארה היא סיסמה קלה לניחוש.

      הכלל: **8 תווים לפחות**, ולא אחת מהסיסמאות הנפוצות. בכוונה לא נדרשים
      תווים מיוחדים/ספרות: דרישות כאלה דוחפות משתמשים ל"Aa1!" בסוף סיסמה
      חלשה. אורך + חסימת רשימה שחורה מגן טוב יותר בפועל, וזו גם ההמלצה
      העדכנית של NIST.

      פרטי ילדים והורים = מידע רגיש (ARCHITECTURE.md), ולכן זו לא הגזמה.
    */
    public static class PasswordPolicy
    {
        public const int MinLength = 8;

        /* הסיסמאות הנפוצות ביותר בעברית ובאנגלית — הראשונות שכל תוקף מנסה. */
        private static readonly HashSet<string> Common = new(StringComparer.OrdinalIgnoreCase)
        {
            "12345678", "123456789", "1234567890", "password", "password1",
            "qwerty123", "11111111", "00000000", "abcd1234", "a1234567",
            "iloveyou", "sunshine", "princess", "football", "welcome1",
            "admin123", "letmein1", "123123123", "87654321", "qwertyui",
            "1q2w3e4r", "zxcvbnm1", "aaaaaaaa", "vaddygo1", "12341234",
        };

        /*
          מחזיר הודעת שגיאה בעברית, או null אם הסיסמה תקינה.
          ההודעה מסבירה **מה לתקן** — לא רק ש"נכשל".
        */
        public static string? Validate(string? password)
        {
            var value = password ?? string.Empty;
            if (value.Length < MinLength)
            {
                return $"הסיסמה חייבת להכיל לפחות {MinLength} תווים";
            }
            if (Common.Contains(value))
            {
                return "הסיסמה הזו נפוצה מדי וקל לנחש אותה. כדאי לבחור אחרת.";
            }
            // רצף של אותו תו ("aaaaaaaa") נחשב נפוץ גם כשאינו ברשימה
            if (value.Distinct().Count() == 1)
            {
                return "הסיסמה הזו נפוצה מדי וקל לנחש אותה. כדאי לבחור אחרת.";
            }
            return null;
        }
    }
}
