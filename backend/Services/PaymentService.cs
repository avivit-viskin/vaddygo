using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      PaymentService — הלוגיקה העסקית של תשלומי התלמידים.
      המערכת מנהלת גן אחד (ריבוי מוסדות מחוץ לתחום), ולכן קטגוריות הגבייה
      הן של הגן הראשון — כמו ב-DashboardService. ניגש ל-DbContext ישירות
      כי צריך לצרף קטגוריות ותשלומים יחד (Include/join).
    */
    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(AppDbContext db, ILogger<PaymentService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<List<PaymentResponseDto>?> GetForStudentAsync(int studentId)
        {
            var studentExists = await _db.Students.AnyAsync(s => s.Id == studentId);
            if (!studentExists)
            {
                return null;
            }

            var categories = await GetGroupCategoriesAsync();
            var existing = await _db.Payments
                .AsNoTracking()
                .Where(p => p.StudentId == studentId)
                .ToDictionaryAsync(p => p.CollectionCategoryId);

            // שורה לכל קטגוריה: הרשומה הקיימת, או ברירת מחדל "טרם שולם" לפי סכום הקטגוריה
            return categories
                .Select(category => existing.TryGetValue(category.Id, out var payment)
                    ? ToResponse(payment, category.Name)
                    : DefaultResponse(studentId, category))
                .ToList();
        }

        public async Task<PaymentResponseDto?> UpsertAsync(int studentId, int categoryId, PaymentUpsertDto dto)
        {
            var studentExists = await _db.Students.AnyAsync(s => s.Id == studentId);
            var category = await _db.CollectionCategories.FirstOrDefaultAsync(c => c.Id == categoryId);
            if (!studentExists || category == null)
            {
                return null;
            }

            var payment = await _db.Payments
                .FirstOrDefaultAsync(p => p.StudentId == studentId && p.CollectionCategoryId == categoryId);

            if (payment == null)
            {
                payment = new Payment { StudentId = studentId, CollectionCategoryId = categoryId };
                _db.Payments.Add(payment);
            }

            payment.Amount = dto.Amount;
            payment.Method = string.IsNullOrEmpty(dto.Method) ? null : dto.Method;
            payment.IsPaid = dto.IsPaid;
            // תאריך התשלום נקבע בשרת בעת הסימון, ומתאפס אם מבטלים את הסימון
            payment.PaidDate = dto.IsPaid ? (payment.PaidDate ?? DateTime.UtcNow) : null;

            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "Payment saved (StudentId: {StudentId}, CategoryId: {CategoryId}, IsPaid: {IsPaid})",
                studentId, categoryId, payment.IsPaid);

            return ToResponse(payment, category.Name);
        }

        /* קטגוריות הגבייה של הגן שהוגדר באשף (הגן הראשון — גן יחיד) */
        private async Task<List<CollectionCategory>> GetGroupCategoriesAsync()
        {
            var group = await _db.Groups
                .Include(g => g.Categories)
                .OrderBy(g => g.Id)
                .FirstOrDefaultAsync();

            return group?.Categories.OrderBy(c => c.Id).ToList() ?? new List<CollectionCategory>();
        }

        private static PaymentResponseDto DefaultResponse(int studentId, CollectionCategory category) => new()
        {
            Id = 0,
            StudentId = studentId,
            CollectionCategoryId = category.Id,
            CategoryName = category.Name,
            Amount = category.AmountPerChild,
            Method = null,
            IsPaid = false,
            PaidDate = null,
        };

        private static PaymentResponseDto ToResponse(Payment payment, string categoryName) => new()
        {
            Id = payment.Id,
            StudentId = payment.StudentId,
            CollectionCategoryId = payment.CollectionCategoryId,
            CategoryName = categoryName,
            Amount = payment.Amount,
            Method = payment.Method,
            IsPaid = payment.IsPaid,
            PaidDate = payment.PaidDate,
        };
    }
}
