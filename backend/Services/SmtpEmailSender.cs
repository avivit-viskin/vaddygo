using System.Net;
using System.Net.Mail;

namespace ParentCommitteeAPI.Services
{
    /*
      SmtpEmailSender — שליחת מייל דרך SMTP (למשל Gmail). ההגדרות מגיעות
      מ-appsettings/משתני סביבה (ב-Railway): Smtp:Host, Smtp:Port, Smtp:User,
      Smtp:Password, Smtp:From. אין סודות בקוד/בריפו — רק שמות המפתחות.

      אם Smtp:Host לא מוגדר — לא שולחים (סביבת פיתוח/לפני הגדרה) אלא רק כותבים
      ללוג, כדי שהזרימה לא תיפול. הגדרת Gmail: Host=smtp.gmail.com, Port=587,
      User=כתובת ה-Gmail, Password=סיסמת אפליקציה (App Password), From=כתובת ה-Gmail.
    */
    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _config;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(IConfiguration config, ILogger<SmtpEmailSender> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendAsync(string toEmail, string subject, string body)
        {
            var host = _config["Smtp:Host"];
            var user = _config["Smtp:User"] ?? string.Empty;
            var from = _config["Smtp:From"];
            if (string.IsNullOrWhiteSpace(from))
            {
                from = user;
            }

            // לא מוגדר SMTP (או חסר שולח) — לא שולחים, רק מתעדים. אין קריסה.
            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
            {
                _logger.LogWarning(
                    "SMTP not configured (Smtp:Host/From) — email to {To} was not sent", toEmail);
                return;
            }

            var port = int.TryParse(_config["Smtp:Port"], out var parsedPort) ? parsedPort : 587;
            var password = _config["Smtp:Password"] ?? string.Empty;

            using var message = new MailMessage
            {
                From = new MailAddress(from, "VaddyGo"),
                Subject = subject,
                Body = body,
                IsBodyHtml = false,
            };
            message.To.Add(toEmail);

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(user, password),
            };

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent to {To}", toEmail);
        }
    }
}
