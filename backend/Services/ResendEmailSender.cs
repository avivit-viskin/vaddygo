using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ParentCommitteeAPI.Services
{
    /*
      ResendEmailSender — שליחת מייל דרך ה-HTTP API של Resend (HTTPS, פורט 443,
      שלא נחסם ע"י Railway). הגדרות: Resend:ApiKey (חובה) ו-Resend:Sender
      (אופציונלי; ברירת מחדל onboarding@resend.dev — עובד גם בלי דומיין משלנו).
      אם חסר מפתח — לא שולחים, רק כותבים ללוג (לא קורסים).

      הערה: בלי דומיין מאומת ב-Resend אפשר לשלוח רק לכתובת של בעל החשבון.
      כדי לשלוח לכל אחד — מאמתים דומיין ומעדכנים את Resend:Sender לכתובת בדומיין.
    */
    public class ResendEmailSender : IEmailSender
    {
        private const string Endpoint = "https://api.resend.com/emails";
        private const string DefaultSender = "VaddyGo <onboarding@resend.dev>";

        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private readonly ILogger<ResendEmailSender> _logger;

        public ResendEmailSender(HttpClient http, IConfiguration config, ILogger<ResendEmailSender> logger)
        {
            _http = http;
            _config = config;
            _logger = logger;
        }

        public async Task SendAsync(string toEmail, string subject, string body)
        {
            var apiKey = _config["Resend:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning(
                    "Resend not configured (Resend:ApiKey) — email to {To} was not sent", toEmail);
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

            var payload = new
            {
                from,
                to = new[] { toEmail },
                subject,
                html,
                text = body,
            };
            var json = JsonSerializer.Serialize(payload);

            using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var respBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("Resend send failed ({Status}) for {To}: {Body}",
                    (int)response.StatusCode, toEmail, respBody);
                throw new InvalidOperationException($"Resend send failed: {(int)response.StatusCode}");
            }

            _logger.LogInformation("Email sent to {To} via Resend", toEmail);
        }
    }
}
