using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      EventWriteDto — הבסיס המשותף להוספה ולעריכה של אירוע בלוח השנה
      (כותרת, תאריך, תיאור, מיקום, תזכורת) — אותה ולידציה פעם אחת (DRY).
    */
    public abstract class EventWriteDto
    {
        [Required(ErrorMessage = "שם האירוע הוא שדה חובה")]
        [StringLength(100, ErrorMessage = "שם האירוע יכול להכיל עד 100 תווים")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "תאריך האירוע הוא שדה חובה")]
        public DateTime? EventDate { get; set; }

        [StringLength(500, ErrorMessage = "התיאור יכול להכיל עד 500 תווים")]
        public string Description { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "המיקום יכול להכיל עד 100 תווים")]
        public string Location { get; set; } = string.Empty;

        public bool Reminder { get; set; }
    }

    public class EventCreateDto : EventWriteDto
    {
    }

    public class EventUpdateDto : EventWriteDto
    {
    }

    public class EventResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public bool Reminder { get; set; }
    }
}
