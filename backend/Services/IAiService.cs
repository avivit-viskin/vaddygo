namespace ParentCommitteeAPI.Services
{
    /*
      IAiService — חוזה עוזרת ה-AI (BL). ה-Controller מדבר רק איתו.
      IsConfigured מאפשר להחזיר הודעה ידידותית כשמפתח ה-API עוד לא הוגדר.
    */
    public interface IAiService
    {
        bool IsConfigured { get; }
        Task<string> AskAsync(string question, string? context);
    }
}
