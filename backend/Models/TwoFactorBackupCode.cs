namespace ParentCommitteeAPI.Models
{
    /*
      TwoFactorBackupCode — קוד חד-פעמי שמחליף את הקוד הנשלח.

      זה לא נוחות אלא תנאי להפעלת התכונה: אימות דו-שלבי מוסיף תלות בגורם חיצוני
      (תיבת מייל, מכשיר טלפון), וכל תלות כזאת יכולה להישבר ברגע הלא נכון. בלי
      קודי גיבוי, אובדן גישה למייל = אובדן גישה למערכת כולה, לצמיתות.

      הקודים נשמרים כטביעת אצבע בלבד ומוצגים למשתמש פעם אחת, ברגע היצירה.
      אי אפשר לשחזר אותם — רק להנפיק סט חדש שמבטל את הישן.
    */
    public class TwoFactorBackupCode
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        /* SHA-256 של הקוד המנורמל. ראו SecureToken.FingerprintCode. */
        public string CodeFingerprint { get; set; } = string.Empty;

        /*
          מתי נוצל. שומרים את השורה ולא מוחקים אותה כדי שאפשר יהיה להראות
          למשתמש כמה קודים נותרו, ולזהות בדיעבד שקוד גיבוי שימש לכניסה.
        */
        public DateTime? UsedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
