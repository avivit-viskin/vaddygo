namespace ParentCommitteeAPI.Models
{
    /*
      User — מנוי המערכת (חבר/ת ועד או מנהלת). ההזדהות לפי UI_SPEC ס' 2:
      בעת הרכישה בוחרים שם משתמש + סיסמה; אפשר להתחבר גם עם Google (אותו חשבון).
      הרשמה = חודש ניסיון; חידוש בתשלום מאריך את התוקף (ראו SubscriptionPolicy).
    */
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        // גיבוב הסיסמה (PBKDF2) — לעולם לא הסיסמה עצמה. ריק אם המשתמש נרשם רק דרך Google.
        public string PasswordHash { get; set; } = string.Empty;

        // מזהה חשבון Google (sub) — למשתמש שהתחבר/נרשם עם Google. אופציונלי.
        public string? GoogleId { get; set; }

        // תפקיד: "Member" (חבר/ת ועד) או "SuperAdmin" (מנהלת VaddyGo — ניהול ספקים)
        public string Role { get; set; } = "Member";

        // המנוי תקף עד תאריך זה (כולל). אחריו הכניסה נחסמת.
        public DateTime SubscriptionValidUntil { get; set; }

        // קוד איפוס סיסמה חד-פעמי — מגובב (כמו הסיסמה, אף פעם לא הקוד עצמו)
        // ותוקפו. null כשאין תהליך איפוס פעיל. מתאפס אחרי איפוס מוצלח.
        public string? ResetCodeHash { get; set; }
        public DateTime? ResetCodeExpiresAt { get; set; }

        // מונה ניסיונות שגויים לקוד האיפוס — אחרי 5 מבטלים את הקוד (מונע ניחוש גס
        // של הקוד בן 6 הספרות). מתאפס עם הפקת קוד חדש ואחרי איפוס מוצלח.
        public int ResetCodeAttempts { get; set; }

        /*
          אימות דו-שלבי. כבוי כברירת מחדל ונדלק ביוזמת המשתמש בלבד — הפעלה
          כפויה הייתה נועלת מחוץ לחשבון מי שלא סיים את ההגדרה.
        */
        public bool TwoFactorEnabled { get; set; }

        /* הערוץ המועדף לקבלת הקוד: "email" (ברירת מחדל) או "sms". */
        public string TwoFactorChannel { get; set; } = Services.TwoFactorChannels.Email;

        /*
          טלפון לקבלת הקוד ב-SMS. **מוצפן** (FieldEncryption) כמו כל טלפון אחר
          במערכת. null כשלא הוגדר — ואז ערוץ ה-SMS פשוט אינו זמין.
        */
        public string? TwoFactorPhone { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // קוד הפניה (?ref=) שדרכו נרשם המשתמש — למקור ההרשמה בדוח השימוש. אופציונלי.
        public string? ReferralCode { get; set; }

        /*
          חשבון מוגן — לעולם לא נמחק ע"י ניקוי אוטומטי או מחיקה מרוכזת.

          נועד לחשבון בוט-הבדיקות (QA) שרץ מול האתר החי. הוא כבר נמחק פעם אחת
          בטעות ע"י סריקת ניקוי, וכל מחיקה כזו משביתה את בדיקות ה-E2E בשקט —
          כלומר מכבה בדיוק את מה שאמור להתריע כשמשהו נשבר.

          הדגל חוסם רק מחיקות **לא-מכוונות** (סריקה בעלייה, מחיקה מהמסך של
          המנהלת). מחיקה יזומה של החשבון עצמו מתוך המערכת נשארת אפשרית.
        */
        public bool IsProtected { get; set; }
    }
}
