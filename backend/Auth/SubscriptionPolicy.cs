namespace ParentCommitteeAPI.Auth
{
    /*
      SubscriptionPolicy — כלל תוקף המנוי (UI_SPEC ס' 2, החלטת בעלת המוצר 09.07.2026):
      כל מנוי תקף עד ה-30.8 של השנה שאחרי הרכישה (לקראת פתיחת שנה"ל).
      דוגמה: רכישה ביולי 2026 → תוקף עד 30.8.2027.
      התאריך אחיד לכולם ולא 12 חודשים מדויקים מיום הרכישה.
    */
    public static class SubscriptionPolicy
    {
        public static DateTime ValidUntil(DateTime purchaseDate)
        {
            // סוף ה-30.8 (עד סוף היום) של השנה שאחרי שנת הרכישה
            return new DateTime(purchaseDate.Year + 1, 8, 30, 23, 59, 59, DateTimeKind.Utc);
        }

        public static bool IsActive(DateTime validUntil)
        {
            return DateTime.UtcNow <= validUntil;
        }
    }
}
