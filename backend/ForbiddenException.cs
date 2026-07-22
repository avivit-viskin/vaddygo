namespace ParentCommitteeAPI
{
    /*
      ForbiddenException — נזרקת כשמשתמש מנסה פעולה שאין לו הרשאה אליה (למשל
      "צופה" שמנסה לערוך). ה-ErrorHandlingMiddleware ממפה אותה ל-403 עם הודעה
      ידידותית, כדי שלא נצטרך try/catch בכל קונטרולר.
    */
    public class ForbiddenException : Exception
    {
        public ForbiddenException(string message = "אין לך הרשאה לבצע את הפעולה הזו")
            : base(message)
        {
        }
    }
}
