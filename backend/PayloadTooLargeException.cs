namespace ParentCommitteeAPI
{
    /*
      PayloadTooLargeException — נזרקת כשהתוכן שנשלח חורג מתקרה של המערכת
      (למשל סך התמונות בכרטיס ספק). ה-ErrorHandlingMiddleware ממפה אותה ל-413
      עם הודעה ידידותית בעברית, כדי שהמשתמש יבין מה למחוק — ולא יקבל שגיאה
      טכנית או 500.
    */
    public class PayloadTooLargeException : Exception
    {
        public PayloadTooLargeException(string message)
            : base(message)
        {
        }
    }
}
