namespace ParentCommitteeAPI.Services
{
    /*
      GoogleSettings — ה-Client ID של Google OAuth (UI_SPEC ס' 2, כניסה עם Google).
      זהו מזהה ציבורי (לא סוד) — לכן יש ברירת מחדל בקוד; אפשר לדרוס דרך
      משתנה הסביבה Google__ClientId אם ייווצר Client ID חדש.
    */
    public static class GoogleSettings
    {
        private const string DefaultClientId =
            "181059185447-cel67c38gsl9ij46u5vjiuqa2h7mcp2l.apps.googleusercontent.com";

        public static string GetClientId(IConfiguration config)
        {
            var value = config["Google:ClientId"];
            return string.IsNullOrWhiteSpace(value) ? DefaultClientId : value;
        }
    }
}
