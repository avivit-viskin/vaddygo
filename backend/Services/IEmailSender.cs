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
