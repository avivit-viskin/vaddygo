namespace ParentCommitteeAPI.DTOs
{
    /*
      SubscriptionsDto — תמונת המנויים של VaddyGo למנהלת: מי במסלול פרו, עד מתי,
      ומי עומד לפוג. שני הצדדים באותו מסך כי זו אותה שאלה עסקית ("מה נכנס החודש
      ומה בסכנה"), רק משני ערוצי הכנסה.
    */
    public class SubscriptionsDto
    {
        public List<SubscriptionRowDto> Committees { get; set; } = new();
        public List<SubscriptionRowDto> Suppliers { get; set; } = new();

        /* נרשמים שלא השלימו את ההקמה (נרשמו אך אין להם ועד) — למעקב ולפנייה
           במייל, וגם לניקוי חשבונות-בדיקה. Status = "incomplete". */
        public List<SubscriptionRowDto> IncompleteSignups { get; set; } = new();

        /* סיכומים מהירים — מחושבים בשרת כדי ששני הצדדים לא יספרו אחרת. */
        public int ActiveCount { get; set; }
        public int ExpiringSoonCount { get; set; }

        /* כמה נהנים מפרו **ללא עלות** (המבצע עד 1.10) — נספר בנפרד
           מהמשלמים, כדי שמספר המנויים ישקף הכנסה ולא מבצע. */
        public int TrialCount { get; set; }
    }

    /*
      SubscriptionRowDto — שורה אחת (ועד או ספק). Status הוא הערך שהמסך מציג:
      "active" (מנוי בתשלום) · "expiring" (פג בתוך 30 יום) · "expired" (פג) ·
      "trial" (פרו ללא עלות — המבצע עד 1.10) · "free" (לא מנוי).
      מחושב בשרת — מקור אמת אחד.
    */
    public class SubscriptionRowDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        /* המייל שאיתו נרשמו — לוועד: מייל הבעלים; לספק: מייל ההתחברות (אם הוגדר).
           למעקב אחר נרשמים חדשים. ריק אם אין. */
        public string Email { get; set; } = string.Empty;
        /* טלפון ליצירת קשר — לספק: מספר הוואטסאפ; לוועד/נרשם: טלפון האימות
           הדו-שלבי אם הוגדר. ריק כשאין (רוב הוועדים לא הזינו טלפון). */
        public string Phone { get; set; } = string.Empty;
        public bool IsPro { get; set; }
        public DateTime? ValidUntil { get; set; }
        public string Status { get; set; } = "free";
        /* כמה ימים נשארו למנוי; null כשאין תאריך תפוגה או שאינו מנוי. */
        public int? DaysLeft { get; set; }
        /* תאריך ההקמה/ההצטרפות — לוועד: מועד יצירת חשבון הבעלים; לספק: מועד
           יצירת הכרטיס. null לרשומות ותיקות שנוצרו לפני שנשמר תאריך. */
        public DateTime? CreatedAt { get; set; }
        /* חשבון מוגן (בוט הבדיקות) — המסך מסמן אותו ולא מאפשר לסמן אותו למחיקה.
           ההגנה עצמה נאכפת בשרת; זה רק כדי שלא ינוסה. */
        public bool IsProtected { get; set; }
    }

    /*
      SetCommitteeProDto — פתיחה/סגירה ידנית של מסלול פרו לגן, על ידי המנהלת.
      Months אופציונלי; ריק = שנה, כמו מנוי בתשלום. מוגבל ל-120 חודשים בבקר,
      כדי שטעות הקלדה לא תיצור מנוי עד שנת 3000.
    */
    public class SetCommitteeProDto
    {
        public bool IsPro { get; set; }
        public int? Months { get; set; }
    }
}
