using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      StudentWriteDto — הבסיס המשותף ל-Create ול-Update:
      אותם שדות ואותה ולידציה פעם אחת, בלי כפילות (DRY).
    */
    public abstract class StudentWriteDto
    {
        [Required(ErrorMessage = "שם פרטי הוא שדה חובה")]
        [StringLength(50, ErrorMessage = "שם פרטי יכול להכיל עד 50 תווים")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "שם משפחה הוא שדה חובה")]
        [StringLength(50, ErrorMessage = "שם משפחה יכול להכיל עד 50 תווים")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "כיתה/קבוצה היא שדה חובה")]
        [StringLength(30, ErrorMessage = "שם הכיתה יכול להכיל עד 30 תווים")]
        public string ClassName { get; set; } = string.Empty;

        [Required(ErrorMessage = "טלפון הורה הוא שדה חובה")]
        [RegularExpression(@"^05\d-?\d{7}$", ErrorMessage = "מספר הטלפון אינו תקין — הפורמט: 05X-XXXXXXX")]
        public string ParentPhoneNumber { get; set; } = string.Empty;
    }
}
