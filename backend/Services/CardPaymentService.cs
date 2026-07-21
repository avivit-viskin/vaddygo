using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    public record CardCheckoutResult(string PaymentUrl);

    /*
      ICardPaymentService — הלוגיקה של תשלום בכרטיס אשראי דרך ספק הסליקה:
      פותח תשלום מאובטח (בבעלות המשתמש), ומטפל באישור (webhook) לסימון "שולם".
    */
    public interface ICardPaymentService
    {
        /* מתחיל תשלום אשראי לקטגוריה של תלמיד (של המשתמש המחובר); null אם לא נמצא/לא מורשה. */
        Task<CardCheckoutResult?> StartCheckoutAsync(int studentId, int categoryId);
        /* מטפל ב-webhook מהספק — מסמן את התשלום "שולם"; true אם עובד תקין. */
        Task<bool> HandleWebhookAsync(string rawBody, IHeaderDictionary headers);
    }

    public class CardPaymentService : ICardPaymentService
    {
        private readonly AppDbContext _db;
        private readonly IAccessScope _access;
        private readonly IPaymentGateway _gateway;
        private readonly IConfiguration _config;
        private readonly ILogger<CardPaymentService> _logger;

        public CardPaymentService(
            AppDbContext db,
            IAccessScope access,
            IPaymentGateway gateway,
            IConfiguration config,
            ILogger<CardPaymentService> logger)
        {
            _db = db;
            _access = access;
            _gateway = gateway;
            _config = config;
            _logger = logger;
        }

        public async Task<CardCheckoutResult?> StartCheckoutAsync(int studentId, int categoryId)
        {
            // בעלות: התלמיד חייב להיות בגן של המשתמש המחובר (IDOR)
            var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == studentId);
            if (student == null || !await _access.CanAccessGroupAsync(student.GroupId))
            {
                return null;
            }
            // הקטגוריה חייבת להיות של הגן של התלמיד — לא של גן אחר
            var category = await _db.CollectionCategories
                .FirstOrDefaultAsync(c => c.Id == categoryId && c.GroupId == student.GroupId);
            if (category == null)
            {
                return null;
            }

            var amount = category.AmountPerChild;
            var reff = Guid.NewGuid().ToString("N");

            // רשומת תשלום ממתינה (או קיימת) — מסמנים את מזהה העסקה; טרם שולם.
            var payment = await _db.Payments
                .FirstOrDefaultAsync(p => p.StudentId == studentId && p.CollectionCategoryId == categoryId);
            if (payment == null)
            {
                payment = new Payment { StudentId = studentId, CollectionCategoryId = categoryId };
                _db.Payments.Add(payment);
            }
            payment.TransactionRef = reff;
            await _db.SaveChangesAsync();

            // מפתחות חשבון הספק של הוועד — כדי שכסף הגבייה יגיע לחשבון של הוועד הזה.
            var group = await _db.Groups.FirstOrDefaultAsync(g => g.Id == student.GroupId);
            var credentials = group == null
                ? null
                : new GatewayCredentials(group.PayApiKey, group.PaySecretKey, group.PayPageUid);

            var returnUrl = _config["Payments:ReturnUrl"] ?? "http://localhost:3000/pay/return";
            var description = $"{category.Name} — {student.FirstName} {student.LastName}".Trim();
            var result = await _gateway.CreatePaymentAsync(
                new GatewayPaymentRequest(amount, description, reff, returnUrl, credentials));

            _logger.LogInformation(
                "Card checkout started (StudentId: {StudentId}, CategoryId: {CategoryId}, Provider: {Provider})",
                studentId, categoryId, _gateway.Name);
            return new CardCheckoutResult(result.PaymentUrl);
        }

        public async Task<bool> HandleWebhookAsync(string rawBody, IHeaderDictionary headers)
        {
            var result = _gateway.ParseWebhook(rawBody, headers);
            if (result == null)
            {
                _logger.LogWarning("Card webhook rejected (invalid/unverified)");
                return false;
            }

            var payment = await _db.Payments
                .FirstOrDefaultAsync(p => p.TransactionRef == result.TransactionRef);
            if (payment == null)
            {
                _logger.LogWarning("Card webhook: no payment for ref {Ref}", result.TransactionRef);
                return false;
            }

            if (result.Success)
            {
                payment.CardAmount = result.Amount;
                payment.IsPaid = true;
                payment.PaidDate = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                _logger.LogInformation("Card payment confirmed (PaymentId: {PaymentId}, Ref: {Ref})",
                    payment.Id, result.TransactionRef);
            }
            else
            {
                _logger.LogInformation("Card payment failed/declined (Ref: {Ref})", result.TransactionRef);
            }
            return true;
        }
    }
}
