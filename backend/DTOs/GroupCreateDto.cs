using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      GroupCreateDto — הנתונים שמגיעים מאשף ההרשמה (UI_SPEC ס' 3-6):
      פרטי הגן, הקבוצות שסומנו, וקטגוריות הגבייה עם הסכומים.
    */
    public class GroupCreateDto
    {
        [Required(ErrorMessage = "שם הגן הוא שדה חובה")]
        [StringLength(80, ErrorMessage = "שם הגן יכול להכיל עד 80 תווים")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "עיר היא שדה חובה")]
        [StringLength(50, ErrorMessage = "שם העיר יכול להכיל עד 50 תווים")]
        public string City { get; set; } = string.Empty;

        [Range(1, 500, ErrorMessage = "מספר הילדים חייב להיות בין 1 ל-500")]
        public int ChildrenCount { get; set; }

        [Range(0, 100, ErrorMessage = "מספר אנשי הצוות חייב להיות בין 0 ל-100")]
        public int StaffCount { get; set; }

        /* שנת הלימודים (אופציונלי) — אם לא נשלח, השרת קובע לפי התאריך הנוכחי */
        [Range(2020, 2100, ErrorMessage = "שנת הלימודים אינה תקינה")]
        public int? Year { get; set; }

        // שמות הקבוצות שסומנו באשף (תינוקייה, פעוטות...) — יכול להיות ריק
        public List<string> Subgroups { get; set; } = new();

        public List<CollectionCategoryDto> Categories { get; set; } = new();
    }

    /* קטגוריית גבייה אחת מתוך מסך "כמה גובים השנה?" */
    public class CollectionCategoryDto
    {
        [Required(ErrorMessage = "שם הקטגוריה הוא שדה חובה")]
        [StringLength(50, ErrorMessage = "שם הקטגוריה יכול להכיל עד 50 תווים")]
        public string Name { get; set; } = string.Empty;

        [Range(0, 100000, ErrorMessage = "הסכום לתלמיד חייב להיות בין 0 ל-100,000")]
        public decimal AmountPerChild { get; set; }

        [Range(1, 3, ErrorMessage = "מספר התשלומים חייב להיות 1, 2 או 3")]
        public int Installments { get; set; } = 1;
    }

    /*
      GroupCategoriesUpdateDto — עדכון קטגוריות הגבייה של גן קיים (מסך "עריכת גבייה").
      מחליף את כל רשימת הקטגוריות — כדי שאפשר יהיה להגדיר/לתקן את הסכומים
      אחרי ההרשמה (עד היום אפשר היה להגדיר קטגוריות רק ביצירת הגן).
    */
    public class GroupCategoriesUpdateDto
    {
        public List<CollectionCategoryDto> Categories { get; set; } = new();
    }
}
