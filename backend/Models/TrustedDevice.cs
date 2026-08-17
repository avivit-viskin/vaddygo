namespace ParentCommitteeAPI.Models
{
    /*
      TrustedDevice — מכשיר שהמשתמש סימן כ"זכור אותי", ולכן פטור מהקוד למשך זמן.

      למה זה חלק מהתכונה ולא קישוט: תכונת אבטחה שמעצבנת בכל כניסה נכבית, ואז
      ההגנה שווה אפס. הפשרה המקובלת היא לדרוש את הקוד ממכשיר **חדש** בלבד —
      שם נמצא הסיכון האמיתי — ולסמוך על מכשיר מוכר לתקופה מוגבלת.

      הפטור אינו לצמיתות: אחרי התפוגה נדרש קוד מחדש, וכיבוי האימות הדו-שלבי
      או הנפקת קודי גיבוי חדשים מבטלים את כל המכשירים בבת אחת.
    */
    public class TrustedDevice
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        /* טביעת אצבע של האסימון שנשמר בדפדפן — לא האסימון עצמו. */
        public string TokenFingerprint { get; set; } = string.Empty;

        public DateTime ExpiresAt { get; set; }

        /*
          מתי נעשה שימוש אחרון — כדי שהמשתמש יזהה שורה ברשימת המכשירים שלו
          ("נראה לאחרונה") ויוכל להסיר מכשיר שאינו מזהה.
        */
        public DateTime LastUsedAt { get; set; } = DateTime.UtcNow;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
