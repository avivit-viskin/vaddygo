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
    }

    /*
      GroupPaymentLinksDto — עדכון קישורי התשלום של הוועד (ביט/פייבוקס) בלבד.
      URL חייב להתחיל ב-http/https אם הוזן (ולידציה קלה — לא ממציאים פורמט).
    */
    public class GroupPaymentLinksDto
    {
        [System.ComponentModel.DataAnnotations.RegularExpression(
            @"^$|^https?://.+",
            ErrorMessage = "קישור ביט חייב להתחיל ב-http:// או https://")]
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
