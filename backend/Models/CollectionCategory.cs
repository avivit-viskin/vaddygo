namespace ParentCommitteeAPI.Models
{
    /*
      CollectionCategory — קטגוריית גבייה של גן (הזנה, דמי ועד, חוגים, קלמר אישי):
      סכום לתלמיד לשנה ומספר תשלומים (1-3), לפי מסך "כמה גובים השנה?" (UI_SPEC ס' 5).
    */
    public class CollectionCategory
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal AmountPerChild { get; set; }
        public int Installments { get; set; } = 1;

        // קטגוריית "תוספת קבוצה" (אופציה 1): null = קטגוריה רגילה שכל הילדים
        // משלמים. אחרת = שם הקבוצה (ClassName) שהתוספת חלה עליה בלבד — מופיעה
        // כשורת תשלום בעדכון היתרה רק לתלמידי אותה קבוצה, ונאספת ככל קטגוריה.
        public string? SubgroupName { get; set; }

        // קשר לגן שאליו שייכת הקטגוריה
        public int GroupId { get; set; }
        public Group? Group { get; set; }
    }
}
