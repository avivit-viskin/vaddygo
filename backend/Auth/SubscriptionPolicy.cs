namespace ParentCommitteeAPI.Auth
{
    /*
      SubscriptionPolicy — כלל תוקף המנוי (UI_SPEC ס' 2):
      • הרשמה חדשה = תקופת ניסיון של חודש בדיוק מרגע ההרשמה (TrialUntil).
        כשהחודש נגמר המנוי נחסם, וגם ה-JWT פג (JwtTokenService expires=ValidUntil),
        כך שהשרת אוכף את הנעילה. חידוש בתשלום יאריך את התוקף (ייבנה עם הסליקה).
      • ValidUntil (עד 30.8 של השנה שאחרי) נשמר לרכישה/חידוש בתשלום — לא להרשמה.
    */
    public static class SubscriptionPolicy
    {
        /* תקופת ניסיון: חודש מדויק מרגע ההרשמה. */
        public static DateTime TrialUntil(DateTime start)
        {
            return start.AddMonths(1);
        }

        /* תוקף מנוי בתשלום: עד סוף ה-30.8 של השנה שאחרי הרכישה (לקראת שנה"ל). */
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
