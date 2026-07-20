using System.Text;
using System.Text.Json;

namespace ParentCommitteeAPI.Services
{
    /* בקשת יצירת תשלום לספק הסליקה: סכום, תיאור, מזהה עסקה שלנו, וכתובת חזרה. */
    public record GatewayPaymentRequest(decimal Amount, string Description, string TransactionRef, string ReturnUrl);

    /* תוצאת יצירת תשלום — הכתובת של עמוד התשלום המאובטח של הספק. */
    public record GatewayPaymentResult(string PaymentUrl);

    /* פענוח webhook מהספק — מזהה העסקה שלנו, הצלחה/כישלון, וסכום ששולם. */
    public record GatewayWebhookResult(string TransactionRef, bool Success, decimal Amount);

    /*
      IPaymentGateway — שכבת הפשטה מעל ספק הסליקה. הקוד שלנו לא יודע *מי* הספק;
      החלפת ספק = החלפת מימוש. לעולם איננו נוגעים בפרטי הכרטיס — הספק מארח את
      עמוד התשלום, ואנחנו מקבלים רק אישור (webhook). זהו התקן הבטוח (PCI SAQ-A).
    */
    public interface IPaymentGateway
    {
        string Name { get; }
        Task<GatewayPaymentResult> CreatePaymentAsync(GatewayPaymentRequest request);
        /* מאמת ומפענח webhook נכנס; מחזיר null אם אינו תקין/מאומת. */
        GatewayWebhookResult? ParseWebhook(string rawBody, IHeaderDictionary headers);
    }

    /*
      MockPaymentGateway — סימולטור לפיתוח ובדיקות: "מייצר" תשלום ומחזיר כתובת
      מדומה, ומקבל webhook פשוט המאומת בסוד משותף. מאפשר לבדוק את כל הזרימה
      מקצה-לקצה בלי כסף אמיתי ובלי מפתחות. פעיל כש-Payments:Provider=mock.
    */
    public class MockPaymentGateway : IPaymentGateway
    {
        private readonly IConfiguration _config;

        public MockPaymentGateway(IConfiguration config)
        {
            _config = config;
        }

        public string Name => "mock";

        public Task<GatewayPaymentResult> CreatePaymentAsync(GatewayPaymentRequest request)
        {
            // בסימולציה: הכתובת מפנה ל"עמוד תשלום מדומה" עם המזהה, שממנו אפשר
            // "לאשר" ולירות webhook. בפרודקשן זו תהיה הכתובת של עמוד הספק.
            var url = $"{request.ReturnUrl}?ref={Uri.EscapeDataString(request.TransactionRef)}"
                    + $"&amount={request.Amount}&mock=1";
            return Task.FromResult(new GatewayPaymentResult(url));
        }

        public GatewayWebhookResult? ParseWebhook(string rawBody, IHeaderDictionary headers)
        {
            // אימות פשוט: אם הוגדר Payments:WebhookSecret, הכותרת X-Mock-Secret חייבת להתאים.
            var expected = _config["Payments:WebhookSecret"];
            if (!string.IsNullOrEmpty(expected) && headers["X-Mock-Secret"] != expected)
            {
                return null;
            }
            try
            {
                using var doc = JsonDocument.Parse(rawBody);
                var root = doc.RootElement;
                var reff = root.TryGetProperty("transactionRef", out var r) ? r.GetString() : null;
                if (string.IsNullOrEmpty(reff))
                {
                    return null;
                }
                var success = root.TryGetProperty("success", out var s) && s.GetBoolean();
                decimal amount = root.TryGetProperty("amount", out var a) && a.TryGetDecimal(out var d) ? d : 0m;
                return new GatewayWebhookResult(reff, success, amount);
            }
            catch
            {
                return null;
            }
        }
    }

    /*
      PayPlusGateway — מתאם ל-PayPlus (עמוד תשלום מתארח + webhook/IPN).
      שלד מוכן: המבנה כאן, וההתאמה המדויקת (endpoint, שמות שדות, חתימת IPN)
      תאומת מול תיעוד ה-sandbox של PayPlus כשיהיו מפתחות אמיתיים. המקומות
      הדורשים אימות מסומנים ב-TODO(sandbox). פעיל כש-Payments:Provider=payplus.
    */
    public class PayPlusGateway : IPaymentGateway
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;

        public PayPlusGateway(HttpClient http, IConfiguration config)
        {
            _http = http;
            _config = config;
        }

        public string Name => "payplus";

        public async Task<GatewayPaymentResult> CreatePaymentAsync(GatewayPaymentRequest request)
        {
            var baseUrl = _config["Payments:PayPlus:BaseUrl"];
            var apiKey = _config["Payments:PayPlus:ApiKey"];
            var secret = _config["Payments:PayPlus:SecretKey"];
            var pageUid = _config["Payments:PayPlus:PaymentPageUid"];
            if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(secret) || string.IsNullOrEmpty(pageUid))
            {
                throw new InvalidOperationException("PayPlus אינו מוגדר — חסרים מפתחות ב-Payments:PayPlus.");
            }

            // TODO(sandbox): לאמת מול תיעוד PayPlus את ה-endpoint (generateLink), שמות
            // השדות, ופורמט האימות (כותרת Authorization כ-JSON של api-key/secret-key).
            var payload = new
            {
                payment_page_uid = pageUid,
                amount = request.Amount,
                currency_code = "ILS",
                more_info = request.TransactionRef,          // המזהה שלנו — יחזור ב-webhook
                refURL_success = request.ReturnUrl,
                refURL_failure = request.ReturnUrl,
                refURL_callback = _config["Payments:WebhookUrl"],
            };
            using var msg = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/PaymentPages/generateLink")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"),
            };
            msg.Headers.Add("Authorization", JsonSerializer.Serialize(new { api_key = apiKey, secret_key = secret }));

            var resp = await _http.SendAsync(msg);
            var body = await resp.Content.ReadAsStringAsync();
            resp.EnsureSuccessStatusCode();

            using var doc = JsonDocument.Parse(body);
            // TODO(sandbox): לאמת את מיקום הקישור בתשובה (data.payment_page_link).
            var link = doc.RootElement.GetProperty("data").GetProperty("payment_page_link").GetString();
            if (string.IsNullOrEmpty(link))
            {
                throw new InvalidOperationException("PayPlus לא החזיר קישור תשלום.");
            }
            return new GatewayPaymentResult(link);
        }

        public GatewayWebhookResult? ParseWebhook(string rawBody, IHeaderDictionary headers)
        {
            // TODO(sandbox): לאמת את חתימת ה-IPN של PayPlus (hash בכותרת) לפני שסומכים על התוכן.
            try
            {
                using var doc = JsonDocument.Parse(rawBody);
                var root = doc.RootElement;
                var t = root.TryGetProperty("transaction", out var tr) ? tr : root;
                var reff = t.TryGetProperty("more_info", out var mi) ? mi.GetString() : null;
                if (string.IsNullOrEmpty(reff))
                {
                    return null;
                }
                var success = t.TryGetProperty("status_code", out var sc) && sc.GetString() == "000";
                decimal amount = t.TryGetProperty("amount", out var am) && am.TryGetDecimal(out var d) ? d : 0m;
                return new GatewayWebhookResult(reff, success, amount);
            }
            catch
            {
                return null;
            }
        }
    }
}
