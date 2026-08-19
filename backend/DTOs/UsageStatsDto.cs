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
      Completed = השלימו את ההגדרה, Stopped = נעצרו באמצע (ההפרש).

      שני חלונות זמן ולא אחד (בקשת בעלת המוצר 19.08.2026): 30 יום מראה מגמה,
      אבל אחרי פנייה לספקים או פרסום צריך לדעת מה קרה **עכשיו** — וב-30 יום
      קפיצה של יומיים נבלעת בממוצע. 5 הימים האחרונים נכללים גם ב-30, ולכן
      המספר הקטן תמיד קטן או שווה לגדול.
    */
    public class FunnelDto
    {
        public int Registered { get; set; }
        public int Completed { get; set; }
        public int Stopped { get; set; }
        public int RegisteredLast5Days { get; set; }
        public int RegisteredLast30Days { get; set; }
    }
}
