using System;

namespace ParentCommitteeAPI.Models
{
    /*
      Lead — "בקשת הצעת מחיר" (RFQ) שוועד שלח לספק. משדרג את מונה הפניות (Vendor.Leads)
      לרשומה אמיתית שהספק יכול לקרוא בתיבת הפניות שלו (פיצ'ר פרו): מה מבקשים, כמות,
      תאריך האירוע, תקציב, הודעה חופשית, ופרטי יצירת קשר של הוועד. הספק מסמן סטטוס
      (חדש / הוגשה הצעה / נסגר בהצלחה / סגור) כדי לנהל את הפניות.
    */
    public class Lead
    {
        public int Id { get; set; }

        // הספק שאליו נשלחה הפנייה
        public int VendorId { get; set; }

        // הוועד ששלח (מזהה ה-Group מכותרת X-Institution), אם ידוע
        public int? GroupId { get; set; }

        // שם הגן/ועד לתצוגה אצל הספק
        public string CommitteeName { get; set; } = string.Empty;

        // מה מבקשים (נושא הפנייה)
        public string Subject { get; set; } = string.Empty;

        public int? Quantity { get; set; }
        public DateTime? EventDate { get; set; }
        public decimal? Budget { get; set; }

        public string Message { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;

        // new | quoted | won | closed
        public string Status { get; set; } = "new";

        public DateTime CreatedAt { get; set; }
    }
}
