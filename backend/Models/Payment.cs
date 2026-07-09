namespace ParentCommitteeAPI.Models
{
    /*
      Payment — תשלום של תלמיד עבור קטגוריית גבייה אחת (הזנה, ועד...).
      מקושר ל-CollectionCategory הקיים (משלב 3) ולא לטבלת קטגוריות חדשה —
      אותן קטגוריות שהוגדרו באשף ההרשמה הן קטגוריות התשלום (DRY).

      התשלום יכול להתחלק בין אמצעים: סכום נפרד לכל אמצעי (ביט/פייבוקס/מזומן),
      והסך שנגבה לקטגוריה = סכום שלושתם.
    */
    public class Payment
    {
        public int Id { get; set; }

        public int StudentId { get; set; }
        public Student? Student { get; set; }

        public int CollectionCategoryId { get; set; }
        public CollectionCategory? Category { get; set; }

        /* סכום ששולם בכל אמצעי (אפשר לפצל תשלום בין אמצעים) */
        public decimal BitAmount { get; set; }
        public decimal PayBoxAmount { get; set; }
        public decimal CashAmount { get; set; }

        public bool IsPaid { get; set; }

        /* מתי סומן ששולם — נגזר אוטומטית בשרת בעת הסימון */
        public DateTime? PaidDate { get; set; }
    }
}
