using System;

namespace ParentCommitteeAPI.Models
{
    /*
      EmailOptOut — כתובת מייל שביקשה להסיר את עצמה מרשימת התפוצה (ברודקאסט).
      מפתח לפי מייל (לא לפי משתמש/ספק) כי הדיוור הוא לפי מייל, וכתובת אחת שהוסרה
      מוחרגת מכל הקהלים. שליחת הברודקאסט מחריגה כל מייל שמופיע כאן.
    */
    public class EmailOptOut
    {
        public int Id { get; set; }

        // הכתובת שהוסרה — נשמרת כפי שנשלח אליה המייל (זהה ל-User.Email / Vendor.LoginEmail).
        public string Email { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
    }
}
