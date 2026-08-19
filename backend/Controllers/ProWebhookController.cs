using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      ProWebhookController — קליטת אישור תשלום מ-GROW (server-to-server) והפעלת מסלול
      פרו אוטומטית לגן/ספק ששילם.

      זרימה: הקישור לתשלום נבנה עם שדות-מזהה (groupId/vendorId + kind) של מי שרוכש;
      GROW קורא לכתובת הזו אחרי תשלום מוצלח עם אותם שדות + פרטי המשלם; אנחנו מוודאים
      סוד משותף, מזהים את היעד, ומדליקים פרו לשנה.

      אבטחה (שלב ראשון): סוד משותף ב-query/header (Grow:WebhookSecret). כשיהיו
      פרטי-API של GROW נוסיף גם אימות מול GROW (confirm transaction). כל בקשה נרשמת
      ללוג במלואה כדי שנוכל לאמת את שמות השדות המדויקים אחרי תשלום-בדיקה.
    */
    [ApiController]
    [AllowAnonymous]
    public class ProWebhookController : ControllerBase
    {
        private readonly IProActivationService _pro;
        private readonly IProIntentStore _intents;
        private readonly IConfiguration _config;
        private readonly ILogger<ProWebhookController> _logger;

        public ProWebhookController(
            IProActivationService pro,
            IProIntentStore intents,
            IConfiguration config,
            ILogger<ProWebhookController> logger)
        {
            _pro = pro;
            _intents = intents;
            _config = config;
            _logger = logger;
        }

        /*
          רישום "כוונת רכישה" — האפליקציה קוראת לזה ברגע שלוחצים "תשלום", לפני
          המעבר ל-GROW. שומרים בזיכרון מי עומד לשלם (גן/ספק), וכשה-webhook מגיע
          אחרי התשלום אנחנו מתאימים לפי זה (כי GROW לא מחזיר את המזהים בקישור).
        */
        public class ProIntentRequest
        {
            public string? Kind { get; set; }      // "committee" | "supplier"
            public int? GroupId { get; set; }
            public int? VendorId { get; set; }
            public string? Email { get; set; }
            public string? Phone { get; set; }
        }

        [HttpPost("api/pro/intent")]
        public async Task<IActionResult> RegisterIntent([FromBody] ProIntentRequest req)
        {
            var kind = (req?.Kind ?? "").Trim().ToLowerInvariant() == "supplier"
                ? ProIntentKind.Supplier
                : ProIntentKind.Committee;
            await _intents.RecordAsync(new ProIntent(
                kind, req?.GroupId, req?.VendorId, req?.Email, req?.Phone, DateTime.UtcNow));
            _logger.LogInformation(
                "Pro intent recorded: {Kind} group={GroupId} vendor={VendorId}",
                kind, req?.GroupId, req?.VendorId);
            return Ok(new { recorded = true });
        }

        [HttpPost("api/pro/grow-webhook")]
        public async Task<IActionResult> GrowWebhook()
        {
            var fields = await ReadAllFieldsAsync();

            // רושמים את כל מה שהתקבל — כך אחרי תשלום-בדיקה רואים בדיוק אילו שדות
            // GROW שולח (מייל/סכום/שדות מותאמים) ומכווננים בהתאם.
            _logger.LogInformation(
                "GROW webhook received: {Payload}",
                JsonSerializer.Serialize(fields));

            // ── אימות סוד משותף ──
            var expected = (_config["Grow:WebhookSecret"] ?? string.Empty).Trim();
            var provided = FirstNonEmpty(fields, "secret", "webhookSecret", "token");
            if (string.IsNullOrEmpty(expected) || provided != expected)
            {
                _logger.LogWarning("GROW webhook rejected — missing/invalid secret");
                return Unauthorized(new { received = false, reason = "bad secret" });
            }

            // ── חילוץ שדות (שמות GROW אומתו מול תשלום-בדיקה: paymentSum, payerEmail,
            //    payerPhone. cField לא חוזרים מקישור סטטי, ו-payerEmail ריק ב-ApplePay). ──
            var email = FirstNonEmpty(
                fields, "payerEmail", "email", "payer_email", "customerEmail",
                "clientEmail", "userEmail", "cField2");
            var phone = FirstNonEmpty(
                fields, "payerPhone", "phone", "cellphone", "mobile", "payer_phone");
            var sumStr = FirstNonEmpty(
                fields, "paymentSum", "sum", "amount", "total", "chargeAmount", "price");
            var sum = decimal.TryParse(sumStr, out var parsedSum) ? parsedSum : 0m;

            var kind = FirstNonEmpty(fields, "kind", "plan", "cField3").ToLowerInvariant();
            int? groupId = ParseId(FirstNonEmpty(fields, "groupId", "cField1"));
            int? vendorId = ParseId(FirstNonEmpty(fields, "vendorId", "cField4"));

            var validUntil = DateTime.UtcNow.AddYears(1);

            // ── החלטה: ספק אם יש vendorId / kind=supplier / סכום גבוה (מסלול הספק
            // הוא ₪1,200 מול ₪149 של הוועד). אחרת — ועד. ──
            var isSupplier = vendorId != null || kind == "supplier" || sum >= 1000m;

            // הזיהוי העיקרי: "כוונת הרכישה" שנרשמה כשלחצו על התשלום (מכילה את ה-groupId/
            // vendorId המדויק). חלון של 45 דקות — יותר מזמן להשלמת תשלום. אם אין כוונה
            // (למשל תשלום מקישור ישיר) — נופלים לשדות שה-webhook עצמו סיפק (טלפון/מייל).
            var intent = await _intents.TakeMostRecentAsync(
                isSupplier ? ProIntentKind.Supplier : ProIntentKind.Committee,
                TimeSpan.FromMinutes(45));

            bool activated;
            if (isSupplier)
            {
                activated = await _pro.ActivateSupplierAsync(
                    intent?.VendorId ?? vendorId,
                    FirstNonEmpty2(intent?.Email, email),
                    FirstNonEmpty2(intent?.Phone, phone),
                    validUntil);
            }
            else
            {
                activated = await _pro.ActivateCommitteeAsync(
                    intent?.GroupId ?? groupId,
                    FirstNonEmpty2(intent?.Email, email),
                    validUntil);
            }

            // GROW מצפה ל-200 כדי לא לשלוח שוב. גם אם לא זוהה יעד — מחזירים 200
            // (התקלה כבר נרשמה ללוג לבדיקה), כדי לא להיתקע בניסיונות חוזרים.
            return Ok(new { received = true, activated, isSupplier });
        }

        // ── עוזרים ──

        // אוסף את כל השדות מהבקשה: query, form (application/x-www-form-urlencoded —
        // הפורמט הנפוץ ב-webhook), או גוף JSON (משוטח, כולל מקונן תחת "data").
        private async Task<Dictionary<string, string>> ReadAllFieldsAsync()
        {
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (var q in Request.Query)
            {
                dict[q.Key] = q.Value.ToString();
            }

            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                foreach (var f in form)
                {
                    dict[f.Key] = f.Value.ToString();
                }
                return dict;
            }

            Request.EnableBuffering();
            using var reader = new StreamReader(Request.Body, leaveOpen: true);
            var raw = await reader.ReadToEndAsync();
            Request.Body.Position = 0;
            if (!string.IsNullOrWhiteSpace(raw))
            {
                dict["_rawBody"] = raw.Length > 4000 ? raw[..4000] : raw;
                try
                {
                    using var doc = JsonDocument.Parse(raw);
                    FlattenJson(doc.RootElement, dict);
                }
                catch
                {
                    /* לא JSON — נשאר עם _rawBody בלבד (רשום ללוג) */
                }
            }
            return dict;
        }

        // משטח JSON: כל מפתח-עלה נכנס למילון בשמו (המקונן דורס — מספיק לצרכינו,
        // כי אנחנו מחפשים שמות שדה ידועים כמו email/sum/cField).
        private static void FlattenJson(JsonElement el, Dictionary<string, string> dict, string prefix = "")
        {
            switch (el.ValueKind)
            {
                case JsonValueKind.Object:
                    foreach (var p in el.EnumerateObject())
                    {
                        FlattenJson(p.Value, dict, p.Name);
                    }
                    break;
                case JsonValueKind.Array:
                    var i = 0;
                    foreach (var item in el.EnumerateArray())
                    {
                        FlattenJson(item, dict, $"{prefix}[{i++}]");
                    }
                    break;
                default:
                    if (!string.IsNullOrEmpty(prefix))
                    {
                        dict[prefix] = el.ToString();
                    }
                    break;
            }
        }

        private static string FirstNonEmpty(Dictionary<string, string> fields, params string[] keys)
        {
            foreach (var k in keys)
            {
                if (fields.TryGetValue(k, out var v) && !string.IsNullOrWhiteSpace(v))
                {
                    return v.Trim();
                }
            }
            return string.Empty;
        }

        private static int? ParseId(string value) =>
            int.TryParse(value, out var n) && n > 0 ? n : null;

        // הראשון מבין שניים שאינו ריק (כוונת-הרכישה קודמת לשדה שה-webhook סיפק).
        private static string? FirstNonEmpty2(string? a, string? b) =>
            !string.IsNullOrWhiteSpace(a) ? a : b;
    }
}
