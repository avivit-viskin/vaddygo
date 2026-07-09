using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      DriveFolderWriteDto — הבסיס המשותף להוספה ולעריכה של קישור תיקייה
      (UI_SPEC ס' 13): שם וקישור, עם ולידציה פעם אחת (DRY).
    */
    public abstract class DriveFolderWriteDto
    {
        [Required(ErrorMessage = "שם התיקייה הוא שדה חובה")]
        [StringLength(80, ErrorMessage = "שם התיקייה יכול להכיל עד 80 תווים")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך להדביק את קישור התיקייה")]
        [StringLength(500, ErrorMessage = "הקישור ארוך מדי")]
        [RegularExpression(@"^https?://.+", ErrorMessage = "הקישור חייב להתחיל ב-http או https")]
        public string Url { get; set; } = string.Empty;
    }

    public class DriveFolderCreateDto : DriveFolderWriteDto
    {
    }

    public class DriveFolderUpdateDto : DriveFolderWriteDto
    {
    }

    public class DriveFolderResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }
}
