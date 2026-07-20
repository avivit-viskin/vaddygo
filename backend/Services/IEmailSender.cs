namespace ParentCommitteeAPI.Services
{
    /*
      IEmailSender — שליחת מייל יוצא (למשל קוד איפוס סיסמה). מופשט כדי שאפשר
      יהיה להחליף ספק (SMTP/Gmail היום, שירות אחר בעתיד) בלי לגעת בלוגיקה.
    */
    public interface IEmailSender
    {
        Task SendAsync(string toEmail, string subject, string body);
    }
}
