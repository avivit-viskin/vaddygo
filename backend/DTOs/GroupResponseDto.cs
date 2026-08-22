namespace ParentCommitteeAPI.DTOs
{
    /*
      GroupResponseDto — מה שחוזר ללקוח על גן: הפרטים, הקטגוריות,
      ויעד הגבייה שמחושב בשרת (סה"כ לתלמיד × מספר ילדים) — לא בלקוח.
    */
    public class GroupResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public int Year { get; set; }
        public int ChildrenCount { get; set; }
        public int StaffCount { get; set; }
        public List<string> Subgroups { get; set; } = new();
        public List<CollectionCategoryResponseDto> Categories { get; set; } = new();
        public decimal TotalPerChild { get; set; }
        public decimal CollectionGoal { get; set; }

        /* מסלול פרו של המוסד — נקבע בשרת בלבד. IsPro כאן הוא "פרו **פעיל**"
           (הדגל דלוק והתוקף לא עבר), כדי שהלקוח לא יצטרך לחשב תפוגה בעצמו. */
        public bool IsPro { get; set; }
        public DateTime? ProValidUntil { get; set; }

        /*
          IsTrial — הפרו פתוח **בזכות חודש הניסיון** ולא בזכות רכישה.
          TrialEndsAt — מתי הניסיון נגמר (גם אחרי שנגמר, כדי שאפשר יהיה להציג
          "תקופת הניסיון הסתיימה" ולא רק להשתיק את הפיצ'רים בלי הסבר).

          בסוף הניסיון החשבון **אינו נחסם** — הוא עובר למסלול החינמי, וכל מה
          שנוצר בתקופת הניסיון נשאר במערכת.
        */
        public bool IsTrial { get; set; }
        public DateTime? TrialEndsAt { get; set; }

        // הרשאת המשתמש המחובר בגן הזה: "manager" | "editor" | "viewer".
        // מאפשר ללקוח להתאים את הממשק (להסתיר עריכה מ"צופה"). ברירת מחדל manager.
        public string Role { get; set; } = "manager";

        // מתי יימחקו אוטומטית נתוני השנה (לקראת שנה חדשה) — כדי שהלקוח יציג
        // התראה מראש. null = טרם נקבע מועד.
        public DateTime? NextCleanupAt { get; set; }

        // קישורי התשלום של הוועד (לבקשת תשלום); ריקים עד שהמשתמשת מגדירה אותם
        public string? BitLink { get; set; }
        public string? PayboxLink { get; set; }

        // תקציבי החגים של הוועד: מפתח "שם|שנה עברית" → סכום
        public Dictionary<string, decimal> HolidayBudgets { get; set; } = new();

        // חשבון סליקת האשראי של הוועד — מוחזרים רק פרטים לא-סודיים + דגל "מוגדר".
        // המפתחות (ApiKey/SecretKey) לעולם לא מוחזרים ללקוח.
        public string? PayProvider { get; set; }
        public string? PayPageUid { get; set; }
        public bool HasClearing { get; set; }

        // חשבון הבנק של הוועד לקבלת תשלומי אשראי (פרטי הוועד עצמו — מוחזרים לבעלים)
        public string? BankHolder { get; set; }
        public string? BankName { get; set; }
        public string? BankBranch { get; set; }
        public string? BankAccount { get; set; }
    }

    /*
      GroupPaymentProviderDto — עדכון חשבון סליקת האשראי של הוועד (המפתחות שלו).
      שדה סוד ריק = "אל תשנה" (משאיר את הקיים) — כדי לא לחייב הקלדה חוזרת של הסוד.
    */
    public class GroupPaymentProviderDto
    {
        public string? Provider { get; set; }
        public string? ApiKey { get; set; }
        public string? SecretKey { get; set; }
        public string? PageUid { get; set; }
    }

    /* GroupNameDto — עדכון שם הגן (תיקון טעות הקלדה). */
    public class GroupNameDto
    {
        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "צריך להזין שם למוסד")]
        [System.ComponentModel.DataAnnotations.StringLength(100, MinimumLength = 1,
            ErrorMessage = "שם המוסד יכול להכיל עד 100 תווים")]
        public string Name { get; set; } = string.Empty;
    }

    /* GroupBankAccountDto — עדכון חשבון הבנק של הוועד לקבלת תשלומי אשראי (בלי מפתחות). */
    public class GroupBankAccountDto
    {
        public string? Holder { get; set; }
        public string? BankName { get; set; }
        public string? Branch { get; set; }
        public string? Account { get; set; }
    }

    /*
      GroupProDto — פתיחה/סגירה של מסלול פרו למוסד (מנהלת VaddyGo בלבד).
      ValidUntil = תוקף המנוי; null = בלי תאריך תפוגה (פתיחה ידנית).
    */
    public class GroupProDto
    {
        public bool IsPro { get; set; }
        public DateTime? ValidUntil { get; set; }
    }

    /*
      GroupPaymentLinksDto — עדכון קישורי התשלום של הוועד.
      ביט = מספר טלפון (כך משלמים בביט) או קישור; פייבוקס = קישור קבוצה.
      ולידציה קלה — לא ממציאים פורמט.
    */
    public class GroupPaymentLinksDto
    {
        // ביט: מספר טלפון (למשל 050-1234567) או קישור; ריק מותר.
        [System.ComponentModel.DataAnnotations.RegularExpression(
            @"^$|^https?://.+|^[+\d][\d\s()-]{5,19}$",
            ErrorMessage = "בביט אפשר להזין מספר טלפון (למשל 050-1234567) או קישור")]
        public string? BitLink { get; set; }

        [System.ComponentModel.DataAnnotations.RegularExpression(
            @"^$|^https?://.+",
            ErrorMessage = "קישור פייבוקס חייב להתחיל ב-http:// או https://")]
        public string? PayboxLink { get; set; }
    }

    public class CollectionCategoryResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal AmountPerChild { get; set; }
        public int Installments { get; set; }
    }
}
