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
    }

    public class CollectionCategoryResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal AmountPerChild { get; set; }
        public int Installments { get; set; }
    }
}
