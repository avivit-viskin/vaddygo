namespace ParentCommitteeAPI.Models
{
    /*
      GroupInvite — הזמנה לגן דרך קישור ייחודי. מנהל יוצר הזמנה (טוקן אקראי +
      הרשאה), והמוזמן — לאחר התחברות — "פודה" את הטוקן ומצטרף כ-GroupMember עם
      אותה הרשאה. עד לפדיון ההזמנה מופיעה ברשימת הצוות כ"ממתין/ה".
    */
    public class GroupInvite
    {
        public int Id { get; set; }
        public int GroupId { get; set; }

        // טוקן אקראי (GUID) שמופיע בקישור ההזמנה — מזהה את ההזמנה בעת הפדיון
        public string Token { get; set; } = string.Empty;

        public string Role { get; set; } = "viewer";

        // שם המוזמן/ת (לתצוגה ברשימת הצוות בלבד)
        public string InviteeName { get; set; } = string.Empty;

        // האם ההזמנה כבר נוצלה (מישהו הצטרף איתה). לא מוחקים אותה — כדי שקישור
        // שכבר נוצל עדיין ידע לאיזה גן הוא שייך (תצוגה + כניסה). הזמנות שנוצלו
        // אינן מופיעות ברשימת "הממתינות".
        public bool Used { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
