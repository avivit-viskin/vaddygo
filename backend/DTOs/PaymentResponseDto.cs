namespace ParentCommitteeAPI.DTOs
{
    /*
      PaymentResponseDto — מצב תשלום של תלמיד עבור קטגוריה אחת.
      מוחזר גם עבור קטגוריות שאין להן עדיין רשומה במסד (Id=0, IsPaid=false),
      כדי שהלקוח יציג שורה לכל קטגוריית גבייה של הגן.
    */
    public class PaymentResponseDto
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int CollectionCategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Method { get; set; }
        public bool IsPaid { get; set; }
        public DateTime? PaidDate { get; set; }
    }
}
