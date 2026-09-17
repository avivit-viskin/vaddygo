using System;

namespace ParentCommitteeAPI.Models
{
    /*
      VendorReview — ביקורת ודירוג בכוכבים שוועד (מוסד) כותב על ספק. **ביקורת אחת
      לכל מוסד לכל ספק** (אינדקס ייחודי VendorId+GroupId) — כתיבה חוזרת מעדכנת את
      הקיימת. מוצגת בלשונית "ביקורות" בכרטיס הספק, יחד עם ממוצע הדירוג.
    */
    public class VendorReview
    {
        public int Id { get; set; }

        // הספק שעליו הביקורת
        public int VendorId { get; set; }

        // הוועד (מוסד) שכתב — מזהה ה-Group מכותרת X-Institution. ביקורת אחת למוסד.
        public int GroupId { get; set; }

        // שם המוסד לתצוגה בביקורת (צילום בזמן הכתיבה, כמו CommitteeName ב-Lead)
        public string CommitteeName { get; set; } = string.Empty;

        // דירוג 1-5 כוכבים
        public int Stars { get; set; }

        // טקסט הביקורת (אופציונלי)
        public string Text { get; set; } = string.Empty;

        // מתי נכתבה/עודכנה לאחרונה
        public DateTime CreatedAt { get; set; }

        // תגובת הספק לביקורת (אופציונלי) — הספק יכול להגיב לביקורת שכתבו עליו.
        public string ReplyText { get; set; } = string.Empty;
        public DateTime? RepliedAt { get; set; }
    }
}
