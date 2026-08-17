using System.Net.Http.Headers;
using System.Text;

namespace ParentCommitteeAPI.Services
{
    /*
      ISmsSender — שליחת מסרון יוצא. מופשט מאותה סיבה כמו IPaymentGateway:
      הקוד שלנו לא יודע *מי* הספק, והחלפתו היא החלפת מימוש בלבד.

      IsConfigured קיים כי בניגוד למייל, SMS **עולה כסף ודורש חשבון אצל ספק**.
      כל עוד אין חשבון, הערוץ קיים בקוד אך אינו מוצע למשתמש — במקום להיכשל
      בשליחה ברגע האמת, הוא פשוט לא מופיע כאפשרות.
    */
    public interface ISmsSender
    {
        bool IsConfigured { get; }
        Task SendAsync(string toPhone, string message);
    }

    /*
      NullSmsSender — ברירת המחדל כשאין ספק מוגדר. אינו שולח דבר ואינו זורק
      בשקט: מי שמנסה לשלוח דרכו קיבל החלטה שגויה במעלה הזרם, ועדיף שזה
      יתפוצץ בבדיקה ולא יישמע כהצלחה.
    */
    public class NullSmsSender : ISmsSender
    {
        public bool IsConfigured => false;

        public Task SendAsync(string toPhone, string message) =>
            throw new InvalidOperationException(
                "לא מוגדר ספק SMS. יש להגדיר Sms__AccountSid ו-Sms__AuthToken.");
    }

    /*
      TwilioSmsSender — מימוש מול Twilio, שנבחר משום שה-API שלו יציב ומתועד
      ואפשר לפתוח חשבון בלי משא ומתן. שולח בקשת HTTP רגילה, בלי חבילה חיצונית.

      ⚠️ נכתב **בלי חשבון פעיל ולכן לא נבדק מול השירות עצמו.** הלוגיקה סביבו
      (בחירת ערוץ, מגבלות, טיפול בשגיאה) נבדקה; שליחה אמיתית ראשונה מחייבת
      אימות ידני. עד שיוגדרו מפתחות, IsConfigured מחזיר false והערוץ מנוטרל.

      החלפת ספק (למשל לספק ישראלי זול יותר): מחליפים את המחלקה הזאת בלבד.
    */
    public class TwilioSmsSender : ISmsSender
    {
        private readonly IHttpClientFactory _http;
        private readonly IConfiguration _config;
        private readonly ILogger<TwilioSmsSender> _logger;

        public TwilioSmsSender(
            IHttpClientFactory http, IConfiguration config, ILogger<TwilioSmsSender> logger)
        {
            _http = http;
            _config = config;
            _logger = logger;
        }

        private string? Sid => _config["Sms:AccountSid"];
        private string? Token => _config["Sms:AuthToken"];
        private string? From => _config["Sms:FromNumber"];

        public bool IsConfigured =>
            !string.IsNullOrWhiteSpace(Sid)
            && !string.IsNullOrWhiteSpace(Token)
            && !string.IsNullOrWhiteSpace(From);

        public async Task SendAsync(string toPhone, string message)
        {
            if (!IsConfigured)
            {
                throw new InvalidOperationException("לא מוגדר ספק SMS.");
            }

            var client = _http.CreateClient();
            var url = $"https://api.twilio.com/2010-04-01/Accounts/{Sid}/Messages.json";

            var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["To"] = toPhone,
                    ["From"] = From!,
                    ["Body"] = message,
                }),
            };
            var basic = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{Sid}:{Token}"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", basic);

            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                // גוף התגובה נרשם ללוג ללא מספר הטלפון — הוא מידע אישי.
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogError(
                    "SMS send failed ({Status}): {Body}", (int)response.StatusCode, body);
                throw new InvalidOperationException("שליחת המסרון נכשלה.");
            }
        }
    }
}
