using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      חוזי האימות הדו-שלבי בין השרת ללקוח.

      עיקרון אחד חוזר בכולם: **הקוד עצמו לעולם אינו יוצא מהשרת**, וגם לא הטלפון
      או המייל המלאים. הלקוח מקבל תיאור מצונזר ("נשלח ל-***1234") שמספיק כדי
      לדעת לאן ללכת, ולא מספיק כדי לזהות את החשבון של מישהו אחר.
    */

    /* ערוץ זמין למשלוח הקוד, כפי שהוא מוצג בכפתור "שלחו לי בדרך אחרת". */
    public class TwoFactorChannelDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        /* לאן יישלח, מצונזר */
        public string Target { get; set; } = string.Empty;
    }

    /*
      תשובת השרת כשהסיסמה נכונה אבל נדרש קוד. אין כאן טוקן — הכניסה טרם
      הושלמה. ChallengeId מזהה את הניסיון הזה בשלב הבא.
    */
    public class TwoFactorRequiredDto
    {
        public bool TwoFactorRequired { get; set; } = true;
        public string ChallengeId { get; set; } = string.Empty;
        public string Channel { get; set; } = string.Empty;
        public string SentTo { get; set; } = string.Empty;
        public List<TwoFactorChannelDto> Channels { get; set; } = new();
    }

    public class TwoFactorVerifyDto
    {
        [Required]
        public string ChallengeId { get; set; } = string.Empty;

        /* קוד בן 6 ספרות **או** קוד גיבוי (XXXX-XXXX) — אותו שדה. */
        [Required]
        public string Code { get; set; } = string.Empty;

        /* "זכור את המכשיר הזה" — פוטר מהקוד בכניסות הבאות מאותו דפדפן. */
        public bool RememberDevice { get; set; }
    }

    /* בקשה לשלוח את הקוד שוב, אפשר בערוץ אחר (זה מה שמציל מי שאין לו מייל כרגע). */
    public class TwoFactorResendDto
    {
        [Required]
        public string ChallengeId { get; set; } = string.Empty;

        /* null = אותו ערוץ שוב. */
        public string? Channel { get; set; }
    }

    /* מצב האימות הדו-שלבי במסך ההגדרות. */
    public class TwoFactorStatusDto
    {
        public bool Enabled { get; set; }
        public string Channel { get; set; } = string.Empty;
        /* טלפון מצונזר, או null אם לא הוגדר */
        public string? Phone { get; set; }
        /* האם ערוץ ה-SMS זמין בכלל (יש ספק מוגדר) */
        public bool SmsAvailable { get; set; }
        public int BackupCodesRemaining { get; set; }
        public int TrustedDevices { get; set; }
    }

    /* שלב 1 בהפעלה: בוחרים ערוץ ומקבלים קוד לאימות שהערוץ באמת עובד. */
    public class TwoFactorSetupDto
    {
        [Required]
        public string Channel { get; set; } = string.Empty;

        /* חובה כשהערוץ הוא sms. */
        public string? Phone { get; set; }
    }

    /* שלב 2 בהפעלה: הקוד שהתקבל בפועל. */
    public class TwoFactorEnableDto
    {
        [Required]
        public string ChallengeId { get; set; } = string.Empty;

        [Required]
        public string Code { get; set; } = string.Empty;
    }

    /*
      קודי הגיבוי — **הפעם היחידה שהם נשלחים ללקוח.** אינם ניתנים לשחזור;
      מי שאיבד אותם מנפיק סט חדש והישן מתבטל.
    */
    public class TwoFactorBackupCodesDto
    {
        public List<string> Codes { get; set; } = new();
    }

    /*
      כיבוי האימות והנפקת קודים חדשים דורשים סיסמה — גם למשתמש שכבר מחובר.
      אחרת מחשב שנשאר פתוח לרגע מספיק כדי להסיר את ההגנה.
    */
    public class TwoFactorPasswordDto
    {
        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
