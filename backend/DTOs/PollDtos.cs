using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      PollCreateDto — יצירת סקר: שאלה ולפחות שתי אפשרויות (סקר עם אפשרות אחת
      אינו סקר). הוולידציה כאן היא הגנת השרת; הלקוח בודק את אותם כללים.
    */
    public class PollCreateDto
    {
        [Required(ErrorMessage = "צריך לכתוב את שאלת הסקר")]
        [StringLength(300, ErrorMessage = "השאלה יכולה להכיל עד 300 תווים")]
        public string Question { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך לפחות שתי אפשרויות")]
        [MinLength(2, ErrorMessage = "צריך לפחות שתי אפשרויות")]
        [MaxLength(20, ErrorMessage = "אפשר עד 20 אפשרויות בסקר")]
        public List<string> Options { get; set; } = new();
    }

    /* PollResponseDto — הסקר כפי שהוועד רואה אותו: כולל קישור ציבורי ותוצאות. */
    public class PollResponseDto
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public string PublicToken { get; set; } = string.Empty;
        public bool IsClosed { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TotalVotes { get; set; }
        public List<PollOptionDto> Options { get; set; } = new();
    }

    public class PollOptionDto
    {
        public int Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public int Votes { get; set; }
    }

    /*
      PublicPollDto — מה שהורה רואה בקישור הציבורי. בלי מזהה הגן ובלי שום פרט
      על הוועד — רק השאלה, האפשרויות והתוצאות עד כה.
    */
    public class PublicPollDto
    {
        public string Question { get; set; } = string.Empty;
        public bool IsClosed { get; set; }
        public int TotalVotes { get; set; }
        public List<PollOptionDto> Options { get; set; } = new();
    }

    /*
      PollVoteDto — הצבעת הורה. VoterKey הוא מזהה אקראי מהדפדפן של ההורה
      (לא פרט מזהה) שמונע הצבעה כפולה בטעות.
    */
    public class PollVoteDto
    {
        [Required]
        public int OptionId { get; set; }

        [Required(ErrorMessage = "חסר מזהה מצביע")]
        [StringLength(64, ErrorMessage = "מזהה המצביע ארוך מדי")]
        public string VoterKey { get; set; } = string.Empty;
    }

    /* PollCloseDto — פתיחה/סגירה של סקר לתשובות נוספות. */
    public class PollCloseDto
    {
        public bool IsClosed { get; set; }
    }
}
