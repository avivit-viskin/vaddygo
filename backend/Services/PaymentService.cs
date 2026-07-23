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
        private readonly IAccessScope _access;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(AppDbContext db, IAccessScope access, ILogger<PaymentService> logger)
        {
            _db = db;
            _access = access;
            _logger = logger;
        }

        public async Task<List<PaymentResponseDto>?> GetForStudentAsync(int studentId)
        {
            // בעלות: התלמיד חייב להיות בגן של המשתמש המחובר (IDOR)
            var student = await _db.Students.AsNoTracking().FirstOrDefaultAsync(s => s.Id == studentId);
            if (student == null || !await _access.CanAccessGroupAsync(student.GroupId))
            {
                return null;
            }

            var categories = await GetGroupCategoriesAsync(student.GroupId);
            var existing = await _db.Payments
                .AsNoTracking()
                .Where(p => p.StudentId == studentId)
                .ToDictionaryAsync(p => p.CollectionCategoryId);

            // שורה לכל קטגוריה: הרשומה הקיימת, או ברירת מחדל "טרם שולם" לפי סכום הקטגוריה
            return categories
                .Select(category => existing.TryGetValue(category.Id, out var payment)
                    ? ToResponse(payment, category)
                    : DefaultResponse(studentId, category))
                .ToList();
        }

        public async Task<List<PaymentResponseDto>> GetAllForGroupAsync(int? groupId = null)
        {
            // בעלות + הפרדת מוסדות: רק הגן שבבעלות המשתמש המחובר (כמו StudentService)
            var scoped = await _access.ScopeGroupIdAsync(groupId);
            if (scoped == null)
            {
                return new List<PaymentResponseDto>();
            }

            var studentIds = await _db.Students.AsNoTracking()
                .Where(s => s.GroupId == scoped.Value)
                .Select(s => s.Id)
                .ToListAsync();
            var categories = await GetGroupCategoriesAsync(scoped.Value);
            if (studentIds.Count == 0 || categories.Count == 0)
            {
                return new List<PaymentResponseDto>();
            }

            // כל התשלומים הקיימים של תלמידי הגן — שאילתה אחת, ממופתחים לפי (תלמיד, קטגוריה)
            var existing = (await _db.Payments.AsNoTracking()
                .Where(p => studentIds.Contains(p.StudentId))
                .ToListAsync())
                .ToDictionary(p => (p.StudentId, p.CollectionCategoryId));

            // שורה לכל תלמיד × קטגוריה: הרשומה הקיימת, או ברירת מחדל "טרם שולם"
            var result = new List<PaymentResponseDto>(studentIds.Count * categories.Count);
            foreach (var studentId in studentIds)
            {
                foreach (var category in categories)
                {
                    result.Add(existing.TryGetValue((studentId, category.Id), out var payment)
                        ? ToResponse(payment, category)
                        : DefaultResponse(studentId, category));
                }
            }
            return result;
        }

        public async Task<PaymentResponseDto?> UpsertAsync(int studentId, int categoryId, PaymentUpsertDto dto)
        {
            // בעלות: התלמיד חייב להיות בגן של המשתמש המחובר (IDOR)
            var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == studentId);
            if (student == null || !await _access.CanAccessGroupAsync(student.GroupId))
            {
                return null;
            }
            // הרשאת עריכה: "צופה" אינו רשאי לרשום/לעדכן תשלום
            if (!await _access.CanEditGroupAsync(student.GroupId)) throw new ForbiddenException();
            // הקטגוריה חייבת להיות של הגן של התלמיד — לא של גן אחר
            var category = await _db.CollectionCategories
                .FirstOrDefaultAsync(c => c.Id == categoryId && c.GroupId == student.GroupId);
            if (category == null)
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

            payment.BitAmount = dto.BitAmount;
            payment.PayBoxAmount = dto.PayBoxAmount;
            payment.CashAmount = dto.CashAmount;
            // אשראי נרשם ידנית כאן (כמו שאר האמצעים); הזנה ידנית גוברת על הערך
            // הקיים — הלקוח שולח בחזרה את הסכום שכבר נגבה, כך שהוא נשמר.
            payment.CardAmount = dto.CardAmount;
            payment.IsPaid = dto.IsPaid;
            // תאריך התשלום נקבע בשרת בעת הסימון, ומתאפס אם מבטלים את הסימון
            payment.PaidDate = dto.IsPaid ? (payment.PaidDate ?? DateTime.UtcNow) : null;

            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "Payment saved (StudentId: {StudentId}, CategoryId: {CategoryId}, IsPaid: {IsPaid})",
                studentId, categoryId, payment.IsPaid);

            return ToResponse(payment, category);
        }

        /* קטגוריות הגבייה של הגן של התלמיד (לא של גן אחר) */
        private async Task<List<CollectionCategory>> GetGroupCategoriesAsync(int? groupId)
        {
            if (groupId == null)
            {
                return new List<CollectionCategory>();
            }
            var group = await _db.Groups
                .Include(g => g.Categories)
                .FirstOrDefaultAsync(g => g.Id == groupId.Value);

            return group?.Categories.OrderBy(c => c.Id).ToList() ?? new List<CollectionCategory>();
        }

        private static PaymentResponseDto DefaultResponse(int studentId, CollectionCategory category) => new()
        {
            Id = 0,
            StudentId = studentId,
            CollectionCategoryId = category.Id,
            CategoryName = category.Name,
            Amount = category.AmountPerChild,
            BitAmount = 0,
            PayBoxAmount = 0,
            CashAmount = 0,
            CardAmount = 0,
            IsPaid = false,
            PaidDate = null,
        };

        private static PaymentResponseDto ToResponse(Payment payment, CollectionCategory category) => new()
        {
            Id = payment.Id,
            StudentId = payment.StudentId,
            CollectionCategoryId = payment.CollectionCategoryId,
            CategoryName = category.Name,
            Amount = category.AmountPerChild,
            BitAmount = payment.BitAmount,
            PayBoxAmount = payment.PayBoxAmount,
            CashAmount = payment.CashAmount,
            CardAmount = payment.CardAmount,
            IsPaid = payment.IsPaid,
            PaidDate = payment.PaidDate,
        };
    }
}
