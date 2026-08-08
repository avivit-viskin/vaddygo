namespace ParentCommitteeAPI.DTOs
{
    /*
      UsageStatsDto — נתוני השימוש במערכת למנהלת VaddyGo: כמה נרשמו, כמה
      השלימו את ההרשמה, וכמה נעצרו באמצע — בשני הצדדים (ועדים וספקים).
      נתונים מצטברים בלבד, בלי שום פרט מזהה של משתמש או ילד.
    */
    public class UsageStatsDto
    {
        public FunnelDto Committees { get; set; } = new();
        public FunnelDto Suppliers { get; set; } = new();
    }

    /*
      FunnelDto — משפך הרשמה אחד. Registered = נרשמו בסך הכל,
      Completed = השלימו את ההגדרה, Stopped = נעצרו באמצע (ההפרש),
      RegisteredLast30Days = כמה מתוכם נרשמו ב-30 הימים האחרונים (קצב).
    */
    public class FunnelDto
    {
        public int Registered { get; set; }
        public int Completed { get; set; }
        public int Stopped { get; set; }
        public int RegisteredLast30Days { get; set; }
    }
}
