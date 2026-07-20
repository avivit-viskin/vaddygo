namespace ParentCommitteeAPI.DTOs
{
    /*
      PaymentResponseDto — מצב תשלום של תלמיד עבור קטגוריה אחת.
      Amount = יעד הקטגוריה (הסכום לתלמיד, לתצוגה); Bit/PayBox/Cash/Card =
      הסכומים ששולמו בפועל בכל אמצעי. הסך ששולם = סכום ארבעתם.
      מוחזר גם עבור קטגוריות שאין להן עדיין רשומה במסד (Id=0, סכומים=0),
      כדי שהלקוח יציג שורה לכל קטגוריית גבייה של הגן.
    */
    public class PaymentResponseDto
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int CollectionCategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;

        /* יעד הקטגוריה (סכום לתלמיד) — לתצוגה ולתזכורות */
        public decimal Amount { get; set; }

        /* הסכומים ששולמו בפועל בכל אמצעי */
        public decimal BitAmount { get; set; }
        public decimal PayBoxAmount { get; set; }
        public decimal CashAmount { get; set; }
        public decimal CardAmount { get; set; }

        public bool IsPaid { get; set; }
        public DateTime? PaidDate { get; set; }
    }
}
