namespace ParentCommitteeAPI
{
    /*
      ProRequiredException — נזרקת כשמוסד שאינו במסלול פרו מנסה להשתמש בפיצ'ר
      פרו. ה-ErrorHandlingMiddleware ממפה אותה ל-402 (Payment Required) עם הודעה
      ידידותית בעברית, כדי שהלקוח יוכל להבחין בין "אין לך הרשאה" (403) לבין
      "צריך לשדרג" (402) ולהציע שדרוג במקום להציג שגיאה מבהילה.
    */
    public class ProRequiredException : Exception
    {
        public ProRequiredException(string message = "הפיצ'ר הזה נמצא במסלול פרו")
            : base(message)
        {
        }
    }
}
