using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      DTOs של הוצאות הקופה (משימת "עריכת יתרת הקופה").
      אמצעי חוקי: bit / paybox / cash — מנורמל ומאומת בשירות.
    */
    public class ExpenseCreateDto
    {
        [Range(0.01, 1000000, ErrorMessage = "סכום ההוצאה חייב להיות גדול מ-0")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "יש לבחור מאיזה אמצעי יצאה ההוצאה")]
        public string Method { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "התיאור יכול להכיל עד 200 תווים")]
        public string? Description { get; set; }
    }

    public class ExpenseResponseDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime Date { get; set; }
    }
}
