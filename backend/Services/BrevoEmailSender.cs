using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ParentCommitteeAPI.Services
{
    /*
      BrevoEmailSender — שליחת מייל דרך ה-HTTP API של Brevo (HTTPS, פורט 443),
      כי פלטפורמות כמו Railway חוסמות שליחת SMTP רגילה (פורט 587). ההגדרות
      מגיעות ממשתני סביבה: Brevo:ApiKey (מפתח ה-API) ו-Brevo:Sender (כתובת
      השולח המאומתת ב-Brevo). אם חסר מפתח/שולח — לא שולחים, רק כותבים ללוג
      (לא קורסים), בדיוק כמו ההתנהגות של השולח הקודם.
    */
    public class BrevoEmailSender : IEmailSender
    {
        private const string Endpoint = "https://api.brevo.com/v3/smtp/email";

        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private readonly ILogger<BrevoEmailSender> _logger;

        public BrevoEmailSender(HttpClient http, IConfiguration config, ILogger<BrevoEmailSender> logger)
        {
            _http = http;
            _config = config;
            _logger = logger;
        }

        public async Task SendAsync(string toEmail, string subject, string body)
        {
            var apiKey = _config["Brevo:ApiKey"];
            var sender = _config["Brevo:Sender"];
            if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(sender))
            {
                _logger.LogWarning(
                    "Brevo not configured (Brevo:ApiKey/Sender) — email to {To} was not sent", toEmail);
                return;
            }

            var payload = new
            {
                sender = new { name = "VaddyGo", email = sender },
                to = new[] { new { email = toEmail } },
                subject,
                textContent = body,
            };
            var json = JsonSerializer.Serialize(payload);

            using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint);
            request.Headers.TryAddWithoutValidation("api-key", apiKey);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var respBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("Brevo send failed ({Status}) for {To}: {Body}",
                    (int)response.StatusCode, toEmail, respBody);
                throw new InvalidOperationException($"Brevo send failed: {(int)response.StatusCode}");
            }

            _logger.LogInformation("Email sent to {To} via Brevo", toEmail);
        }
    }
}
