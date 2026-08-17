namespace ParentCommitteeAPI.Models
{
    /*
      TwoFactorChallenge — התחברות שעברה סיסמה ומחכה לקוד.

      למה טבלה ולא שדות על User: בין שני השלבים המשתמש **עדיין לא מחובר** ואין
      לו טוקן, ולכן צריך משהו שיזהה את הניסיון הספציפי הזה. השמירה כשורה נפרדת
      גם מאפשרת שני ניסיונות במקביל (מחשב וטלפון) בלי שהאחד ידרוס את השני, וגם
      מוודאת שהסיסמה לא נשלחת שוב בשלב השני.

      השורה נמחקת ברגע שהקוד אומת, וממילא פגה אחרי 10 דקות.
    */
    public class TwoFactorChallenge
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        /*
          טביעת אצבע של המזהה שנמסר ללקוח (SHA-256) — לא המזהה עצמו. מי שישיג
          עותק של המסד לא יוכל להשתלט על ניסיון התחברות פתוח.
        */
        public string ChallengeFingerprint { get; set; } = string.Empty;

        /* הקוד בן 6 הספרות — מגובב ב-PBKDF2 כמו סיסמה (סוד קצר וניתן לניחוש). */
        public string CodeHash { get; set; } = string.Empty;

        /* דרך איזה ערוץ נשלח הקוד בפועל — כדי להציג "נשלח ל..." בלקוח. */
        public string Channel { get; set; } = string.Empty;

        public DateTime ExpiresAt { get; set; }

        /* ניסיונות שגויים; מעל הסף האתגר נסגר ויש להתחיל התחברות מחדש. */
        public int Attempts { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
