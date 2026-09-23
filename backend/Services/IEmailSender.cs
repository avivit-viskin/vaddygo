namespace ParentCommitteeAPI.Services
{
    /*
      IEmailSender — שליחת מייל יוצא (למשל קוד איפוס סיסמה). מופשט כדי שאפשר
      יהיה להחליף ספק (SMTP/Gmail היום, שירות אחר בעתיד) בלי לגעת בלוגיקה.
    */
    public interface IEmailSender
    {
        Task SendAsync(string toEmail, string subject, string body);

        /*
          האם השליחה בכלל אפשרית (ספק מוגדר). ברירת המחדל: כן.

          ⚠️ נחוץ לאכיפת האימות הדו-שלבי: השליחה **בולעת שגיאות** בכוונה (כדי
          שתקלת מייל לא תפיל התחברות), ולכן בלי הבדיקה הזו ספק מייל שאינו
          מוגדר היה יוצר אתגר שהקוד שלו לעולם לא מגיע — ונועל **את כל בעלי
          המוסדות** מחוץ למערכת, בשקט.
        */
        bool IsConfigured => true;

        /*
          שליחה עם קובץ מצורף (למשל גיבוי DB). ברירת המחדל מתעלמת מהצירוף ושולחת
          רק את הגוף — כך מימושים שאינם תומכים בצירוף (FileEmailSender בפיתוח)
          אינם נשברים; מימוש שתומך (ResendEmailSender) דורס עם צירוף אמיתי.
        */
        Task SendWithAttachmentAsync(
            string toEmail, string subject, string body,
            string attachmentFilename, byte[] attachmentContent)
            => SendAsync(toEmail, subject, body);
    }
}
