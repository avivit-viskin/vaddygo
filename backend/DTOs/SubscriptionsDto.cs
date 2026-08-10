namespace ParentCommitteeAPI.DTOs
{
    /*
      SubscriptionsDto — תמונת המנויים של VaddyGo למנהלת: מי במסלול פרו, עד מתי,
      ומי עומד לפוג. שני הצדדים באותו מסך כי זו אותה שאלה עסקית ("מה נכנס החודש
      ומה בסכנה"), רק משני ערוצי הכנסה.
    */
    public class SubscriptionsDto
    {
        public List<SubscriptionRowDto> Committees { get; set; } = new();
        public List<SubscriptionRowDto> Suppliers { get; set; } = new();

        /* סיכומים מהירים — מחושבים בשרת כדי ששני הצדדים לא יספרו אחרת. */
        public int ActiveCount { get; set; }
        public int ExpiringSoonCount { get; set; }
    }

    /*
      SubscriptionRowDto — שורה אחת (ועד או ספק). Status הוא הערך שהמסך מציג:
      "active" (מנוי פעיל) · "expiring" (פג בתוך 30 יום) · "expired" (פג) ·
      "free" (לא מנוי). מחושב בשרת — מקור אמת אחד.
    */
    public class SubscriptionRowDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsPro { get; set; }
        public DateTime? ValidUntil { get; set; }
        public string Status { get; set; } = "free";
        /* כמה ימים נשארו למנוי; null כשאין תאריך תפוגה או שאינו מנוי. */
        public int? DaysLeft { get; set; }
    }
}
