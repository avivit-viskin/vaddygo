using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      GiftWriteDto — הבסיס המשותף להוספה ולעריכה של מתנה (UI_SPEC ס' 12):
      אותם שדות ואותה ולידציה פעם אחת (DRY).
    */
    public abstract class GiftWriteDto
    {
        [Required(ErrorMessage = "שם המתנה הוא שדה חובה")]
        [StringLength(80, ErrorMessage = "שם המתנה יכול להכיל עד 80 תווים")]
        public string Name { get; set; } = string.Empty;

        [StringLength(60, ErrorMessage = "מזהה החג ארוך מדי")]
        public string? HolidayKey { get; set; }

        [StringLength(40, ErrorMessage = "שם החג ארוך מדי")]
        public string? HolidayName { get; set; }

        [Range(0, 1000000, ErrorMessage = "התקציב חייב להיות בין 0 ל-1,000,000")]
        public decimal TotalAmount { get; set; }

        [RegularExpression("planned|buying|done",
            ErrorMessage = "סטטוס לא תקין — מתוכנן/בקנייה/בוצע בלבד")]
        public string Status { get; set; } = "planned";

        public int? VendorId { get; set; }
    }

    public class GiftCreateDto : GiftWriteDto
    {
    }

    public class GiftUpdateDto : GiftWriteDto
    {
    }

    public class GiftResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? HolidayKey { get; set; }
        public string? HolidayName { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "planned";
        public int? VendorId { get; set; }
    }
}
