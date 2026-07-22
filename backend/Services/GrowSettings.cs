namespace ParentCommitteeAPI.Services
{
    /*
      GrowSettings — פרטי החיבור לסליקת Grow (חידוש מנוי חודשי). אלה *סודות*, ולכן
      אין ברירת מחדל בקוד — הם מגיעים ממשתני סביבה (ב-Railway: Grow__PageCode,
      Grow__ApiKey, Grow__Secret, Grow__BaseUrl). ריקים עד שמחברים את הסליקה בפועל;
      IsConfigured אומר אם כבר הוגדרו — לפני זה אין מה לגבות.
    */
    public static class GrowSettings
    {
        public static string GetPageCode(IConfiguration config) => config["Grow:PageCode"] ?? "";
        public static string GetApiKey(IConfiguration config) => config["Grow:ApiKey"] ?? "";
        public static string GetSecret(IConfiguration config) => config["Grow:Secret"] ?? "";

        // כתובת הבסיס של ה-API של Grow (סביבת בדיקות או ייצור) — נקבעת בהגדרות.
        public static string GetBaseUrl(IConfiguration config) => config["Grow:BaseUrl"] ?? "";

        // האם הסליקה כבר הוגדרה (יש קוד עמוד + מפתח). המסך והנעילה קיימים ממילא;
        // כשזה true — אפשר להפעיל את זרם התשלום בפועל.
        public static bool IsConfigured(IConfiguration config) =>
            !string.IsNullOrWhiteSpace(GetPageCode(config)) &&
            !string.IsNullOrWhiteSpace(GetApiKey(config));
    }
}
