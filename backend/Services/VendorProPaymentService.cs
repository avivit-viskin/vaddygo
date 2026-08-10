using Microsoft.EntityFrameworkCore;

namespace ParentCommitteeAPI.Services
{
    /*
      IVendorProPaymentService — רכישת מסלול פרו על ידי הספק עצמו, בסליקה.

      עד היום פרו לספק נפתח **ידנית** על ידי מנהלת VaddyGo אחרי פנייה בוואטסאפ.
      כאן הספק משלם בעצמו: אנחנו פותחים עמוד תשלום מאובטח אצל ספק הסליקה,
      ופותחים לו את המסלול רק אחרי אישור משרת-לשרת (webhook).

      אנחנו לעולם לא נוגעים בפרטי הכרטיס — עמוד התשלום מתארח אצל ספק הסליקה
      (אותו עיקרון של סליקת הגבייה; ראו IPaymentGateway).
    */
    public interface IVendorProPaymentService
    {
        /* פותח תשלום לשדרוג פרו ומחזיר את כתובת עמוד התשלום. null אם הטוקן שגוי. */
        Task<string?> StartCheckoutAsync(string editToken, string returnUrl);

        /* האם מזהה העסקה הזה שייך לרכישת פרו של ספק (לניתוב ה-webhook). */
        bool OwnsTransaction(string transactionRef);

        /* אישור/דחייה של תשלום שאומת. מחזיר true אם הטיפול הצליח. */
        Task<bool> ConfirmAsync(string transactionRef, bool success);
    }

    public class VendorProPaymentService : IVendorProPaymentService
    {
        /* קידומת מזהה העסקה — מאפשרת webhook אחד לכל סוגי התשלומים במערכת. */
        private const string RefPrefix = "vendorpro:";

        /* ברירת מחדל למחיר ולתקופה; ניתנים לשינוי בהגדרות בלי לגעת בקוד. */
        private const decimal DefaultPrice = 1200m;
        private const int DefaultMonths = 12;

        private readonly AppDbContext _db;
        private readonly IPaymentGateway _gateway;
        private readonly IConfiguration _config;
        private readonly ILogger<VendorProPaymentService> _logger;

        public VendorProPaymentService(
            AppDbContext db,
            IPaymentGateway gateway,
            IConfiguration config,
            ILogger<VendorProPaymentService> logger)
        {
            _db = db;
            _gateway = gateway;
            _config = config;
            _logger = logger;
        }

        public bool OwnsTransaction(string transactionRef) =>
            (transactionRef ?? string.Empty).StartsWith(RefPrefix, StringComparison.Ordinal);

        public async Task<string?> StartCheckoutAsync(string editToken, string returnUrl)
        {
            var token = (editToken ?? string.Empty).Trim();
            if (token.Length == 0)
            {
                return null;
            }
            // הטוקן האישי הוא אמצעי הזיהוי של הספק (אין לו חשבון במערכת)
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.EditToken == token);
            if (vendor == null)
            {
                return null;
            }

            var price = _config.GetValue("Payments:SupplierProPrice", DefaultPrice);
            // מזהה עסקה חד-פעמי — כך ה-webhook יודע לאיזה ספק לפתוח את המסלול,
            // ותשלום ישן שחוזר באיחור לא יפתח מסלול פעמיים.
            var transactionRef = $"{RefPrefix}{vendor.Id}:{Guid.NewGuid():N}";

            var result = await _gateway.CreatePaymentAsync(new GatewayPaymentRequest(
                Amount: price,
                Description: $"מסלול פרו לספק — {vendor.Name}",
                TransactionRef: transactionRef,
                ReturnUrl: returnUrl));

            vendor.ProTransactionRef = transactionRef;
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Vendor pro checkout started (VendorId: {VendorId}, Amount: {Amount})",
                vendor.Id, price);
            return result.PaymentUrl;
        }

        public async Task<bool> ConfirmAsync(string transactionRef, bool success)
        {
            var vendor = await _db.Vendors
                .FirstOrDefaultAsync(v => v.ProTransactionRef == transactionRef);
            if (vendor == null)
            {
                // תשלום שאין לו ספק תואם — לא פותחים כלום, ומתעדים לבדיקה
                _logger.LogWarning("Vendor pro webhook: no vendor for ref {Ref}", transactionRef);
                return false;
            }

            if (!success)
            {
                _logger.LogInformation(
                    "Vendor pro payment failed/declined (VendorId: {VendorId})", vendor.Id);
                return true; // טופל כראוי — פשוט לא פותחים מסלול
            }

            var months = _config.GetValue("Payments:SupplierProMonths", DefaultMonths);
            // חידוש לפני שהמנוי פג מאריך מהתאריך הקיים, כדי שלא "יאבדו" ימים
            var from = vendor.ProValidUntil is DateTime until && until > DateTime.UtcNow
                ? until
                : DateTime.UtcNow;

            vendor.IsPro = true;
            vendor.ProValidUntil = from.AddMonths(months);
            // מנקים את המזהה כדי שאותו webhook לא יאריך את המנוי פעם נוספת
            vendor.ProTransactionRef = string.Empty;
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Vendor pro activated (VendorId: {VendorId}, Until: {Until})",
                vendor.Id, vendor.ProValidUntil);
            return true;
        }
    }
}
