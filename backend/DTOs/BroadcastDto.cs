using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      BroadcastDto — הודעה אחת שנשלחת לכל בעלי המוסדות.
      הנוסח מגיע מהמסך ולא מקובע בשרת, כדי שאפשר יהיה לשלוח עדכונים שונים
      בלי פריסה חדשה בכל פעם.
    */
    public class BroadcastDto
    {
        [Required(ErrorMessage = "יש למלא נושא")]
        [StringLength(200, ErrorMessage = "הנושא יכול להכיל עד 200 תווים")]
        public string Subject { get; set; } = string.Empty;

        [Required(ErrorMessage = "יש למלא תוכן הודעה")]
        [StringLength(5000, ErrorMessage = "ההודעה יכולה להכיל עד 5000 תווים")]
        public string Body { get; set; } = string.Empty;
    }

    /* תוצאת השליחה — מספרים בלבד, בלי רשימת נמענים. */
    public class BroadcastResultDto
    {
        public int Total { get; set; }
        public int Sent { get; set; }
        public int Failed { get; set; }
    }
}
