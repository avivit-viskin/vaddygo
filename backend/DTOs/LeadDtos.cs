using System;

namespace ParentCommitteeAPI.DTOs
{
    /* בקשת הצעת מחיר (RFQ) שהוועד שולח לספק. */
    public class LeadCreateDto
    {
        public string Subject { get; set; } = string.Empty;
        public int? Quantity { get; set; }
        public DateTime? EventDate { get; set; }
        public decimal? Budget { get; set; }
        public string Message { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        // שם הגן/ועד — הפרונט ממלא מהמוסד הפעיל (הספק יראה ממי הגיעה הפנייה).
        public string CommitteeName { get; set; } = string.Empty;
    }

    /* פנייה כפי שהספק רואה אותה בתיבת הפניות. */
    public class LeadResponseDto
    {
        public int Id { get; set; }
        public string CommitteeName { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public int? Quantity { get; set; }
        public DateTime? EventDate { get; set; }
        public decimal? Budget { get; set; }
        public string Message { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string Status { get; set; } = "new";
        public DateTime CreatedAt { get; set; }
    }

    /* עדכון סטטוס פנייה ע"י הספק. */
    public class LeadStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
