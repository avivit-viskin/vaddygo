namespace ParentCommitteeAPI.Models
{
    /*
      Payment — תשלום של תלמיד עבור קטגוריית גבייה אחת (הזנה, ועד...).
      מקושר ל-CollectionCategory הקיים (משלב 3) ולא לטבלת קטגוריות חדשה —
      אותן קטגוריות שהוגדרו באשף ההרשמה הן קטגוריות התשלום (DRY).

      MVP: רשומה אחת לכל (תלמיד, קטגוריה) עם סימון שולם/לא שולם ידני.
      חלוקה לתשלומים (1/2/3) ומעקב פר-תשלום הם הרחבה עתידית — הקטגוריה כבר
      מחזיקה את מספר התשלומים.
    */
    public class Payment
    {
        public int Id { get; set; }

        public int StudentId { get; set; }
        public Student? Student { get; set; }

        public int CollectionCategoryId { get; set; }
        public CollectionCategory? Category { get; set; }

        /* הסכום שנרשם בפועל (ברירת מחדל: הסכום לתלמיד של הקטגוריה) */
        public decimal Amount { get; set; }

        /* אמצעי התשלום: bit / paybox / cash. null כל עוד לא סומן ששולם. */
        public string? Method { get; set; }

        public bool IsPaid { get; set; }

        /* מתי סומן ששולם — נגזר אוטומטית בשרת בעת הסימון */
        public DateTime? PaidDate { get; set; }
    }
}
