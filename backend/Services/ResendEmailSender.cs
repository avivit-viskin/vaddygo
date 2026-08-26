using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ParentCommitteeAPI.Services
{
    /*
      ResendEmailSender — שליחת מייל דרך ה-HTTP API של Resend (HTTPS, פורט 443,
      שלא נחסם ע"י Railway). הגדרות: Resend:ApiKey (חובה) ו-Resend:Sender
      (אופציונלי; ברירת מחדל noreply@vaddygo.com — הדומיין המאומת שלנו).
      אם חסר מפתח — לא שולחים, רק כותבים ללוג (לא קורסים).

      הדומיין vaddygo.com מאומת ב-Resend, ולכן אפשר לשלוח לכל נמען מכתובת בדומיין
      (כל כתובת @vaddygo.com עובדת). ניתן לדרוס עם משתנה הסביבה Resend__Sender.
    */
    public class ResendEmailSender : IEmailSender
    {
        private const string Endpoint = "https://api.resend.com/emails";
        private const string DefaultSender = "VaddyGo <noreply@vaddygo.com>";

        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private readonly ILogger<ResendEmailSender> _logger;

        public ResendEmailSender(HttpClient http, IConfiguration config, ILogger<ResendEmailSender> logger)
        {
            _http = http;
            _config = config;
            _logger = logger;
        }

        /*
          כתובת מייל היא מידע אישי, ולוגים אינם מקום לאחסן בו מידע אישי:
          ספק האירוח שומר אותם 7 ימים, **אינו מאפשר מחיקה לפי בקשה**, והם
          אינם מכוסים בזכות המחיקה של המשתמש. לכן נרשם רק הדומיין — מספיק
          כדי לאבחן תקלת שליחה ("כל הגוגל נכשל"), ואינו מזהה אדם.
        */
        private static string Domain(string email)
        {
            var at = email.LastIndexOf('@');
            return at >= 0 && at < email.Length - 1 ? email[(at + 1)..] : "unknown";
        }

        /*
          תגובת שגיאה של הספק מוחזרת אלינו כטקסט חופשי, ובשגיאות ולידציה היא
          מצטטת את הכתובת שנשלחה. בלי הצנזור הזה היינו מסננים את הכתובת בכניסה
          ומחזירים אותה ללוג דרך הדלת האחורית.
        */
        private static readonly System.Text.RegularExpressions.Regex EmailPattern =
            new(@"[\w.+-]+@[\w.-]+\.\w+", System.Text.RegularExpressions.RegexOptions.Compiled);

        private static string RedactEmails(string text) =>
            EmailPattern.Replace(text ?? string.Empty, "<redacted>");

        public Task SendAsync(string toEmail, string subject, string body) =>
            SendInternalAsync(toEmail, subject, body, null, null);

        public Task SendWithAttachmentAsync(
            string toEmail, string subject, string body,
            string attachmentFilename, byte[] attachmentContent) =>
            SendInternalAsync(toEmail, subject, body, attachmentFilename, attachmentContent);

        private async Task SendInternalAsync(
            string toEmail, string subject, string body,
            string? attachmentFilename, byte[]? attachmentContent)
        {
            var apiKey = _config["Resend:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning(
                    "Resend not configured (Resend:ApiKey) — email to a {Domain} address was not sent",
                    Domain(toEmail));
                return;
            }

            var from = _config["Resend:Sender"];
            if (string.IsNullOrWhiteSpace(from))
            {
                from = DefaultSender;
            }

            // גוף HTML עם dir="rtl" כדי שהעברית תוצג מימין-לשמאל בכל תוכנת מייל
            // (שורות ריקות ב-body הופכות ל-<br>). text נשמר כגיבוי טקסט פשוט.
            var html =
                "<div dir=\"rtl\" style=\"text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6\">"
                + System.Net.WebUtility.HtmlEncode(body).Replace("\n", "<br>")
                + "</div>";

            // Resend מקבל קבצים מצורפים כמערך של { filename, content(base64) }.
            object[]? attachments = null;
            if (attachmentContent != null && attachmentContent.Length > 0
                && !string.IsNullOrWhiteSpace(attachmentFilename))
            {
                attachments = new object[]
                {
                    new
                    {
                        filename = attachmentFilename,
                        content = Convert.ToBase64String(attachmentContent),
                    }
                };
            }

            object payload = attachments == null
                ? new { from, to = new[] { toEmail }, subject, html, text = body }
                : new { from, to = new[] { toEmail }, subject, html, text = body, attachments };
            var json = JsonSerializer.Serialize(payload);

            using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var respBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("Resend send failed ({Status}) for a {Domain} address: {Body}",
                    (int)response.StatusCode, Domain(toEmail), RedactEmails(respBody));
                throw new InvalidOperationException($"Resend send failed: {(int)response.StatusCode}");
            }

            _logger.LogInformation("Email sent to a {Domain} address via Resend", Domain(toEmail));
        }
    }
}
