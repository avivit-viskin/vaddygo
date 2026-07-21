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

    /* GroupBankAccountDto — עדכון חשבון הבנק של הוועד לקבלת תשלומי אשראי (בלי מפתחות). */
    public class GroupBankAccountDto
    {
        public string? Holder { get; set; }
        public string? BankName { get; set; }
        public string? Branch { get; set; }
        public string? Account { get; set; }
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
