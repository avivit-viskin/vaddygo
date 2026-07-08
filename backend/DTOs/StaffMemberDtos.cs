using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      StaffMemberWriteDto — הבסיס המשותף להוספה ולעריכה של איש צוות
      (UI_SPEC ס' 8: שם מלא, תאריך לידה, תפקיד) — אותה ולידציה פעם אחת (DRY).
    */
    public abstract class StaffMemberWriteDto
    {
        [Required(ErrorMessage = "שם מלא הוא שדה חובה")]
        [StringLength(80, ErrorMessage = "השם יכול להכיל עד 80 תווים")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "תפקיד הוא שדה חובה")]
        [StringLength(50, ErrorMessage = "התפקיד יכול להכיל עד 50 תווים")]
        public string Role { get; set; } = string.Empty;

        [Required(ErrorMessage = "תאריך לידה הוא שדה חובה")]
        public DateTime? BirthDate { get; set; }
    }

    public class StaffMemberCreateDto : StaffMemberWriteDto
    {
    }

    public class StaffMemberUpdateDto : StaffMemberWriteDto
    {
    }

    public class StaffMemberResponseDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime BirthDate { get; set; }
    }
}
