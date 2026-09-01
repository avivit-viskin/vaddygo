using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;
using ParentCommitteeAPI.Repositories;

namespace ParentCommitteeAPI.Services
{
    /*
      ExpenseService — הלוגיקה העסקית של הוצאות הקופה: מיפוי DTO ↔ מודל, נרמול
      אמצעי התשלום, וסינון/בעלות לפי המשתמש המחובר (IAccessScope) — כמו התלמידים.
    */
    public class ExpenseService : IExpenseService
    {
        private static readonly HashSet<string> AllowedMethods = new() { "bit", "paybox", "cash", "card" };

        // כמה זמן פריט נשאר בסל המיחזור לפני מחיקה לצמיתות (שירות הרקע).
        public const int TrashRetentionDays = 30;

        private readonly IRepository<Expense> _expenses;
        private readonly AppDbContext _db;
        private readonly IAccessScope _access;
        private readonly ILogger<ExpenseService> _logger;

        public ExpenseService(
            IRepository<Expense> expenses, AppDbContext db, IAccessScope access,
            ILogger<ExpenseService> logger)
        {
            _expenses = expenses;
            _db = db;
            _access = access;
            _logger = logger;
        }

        public async Task<List<ExpenseResponseDto>> GetAllAsync(int? groupId = null)
        {
            var scoped = await _access.ScopeGroupIdAsync(groupId);
            if (scoped == null)
            {
                return new List<ExpenseResponseDto>();
            }
            /*
              🔴 סינון במסד ולא בזיכרון. קודם נטענו **כל** ההוצאות של **כל**
              המוסדות — כולל צילומי הקבלות שלהן — ורק אז נבחר המוסד הנכון.
              במדידה על 2,000 מוסדות זה לקח 22.6 שניות והפיל את השרת בזיכרון.
            */
            var expenses = (await _expenses.FindAsync(e => e.GroupId == scoped.Value))
                .OrderByDescending(e => e.Date)
                .Select(ToResponse)
                .ToList();
            return expenses;
        }

        public async Task<ExpenseResponseDto> CreateAsync(ExpenseCreateDto dto, int? groupId = null)
        {
            // בעלות: משייכים לגן שבבעלות המשתמש (מאומת מול ה-JWT)
            var scoped = await _access.ScopeGroupIdAsync(groupId);
            // הרשאת עריכה: "צופה" אינו רשאי ליצור נתונים
            if (scoped != null && !await _access.CanEditGroupAsync(scoped)) throw new ForbiddenException();
            var expense = new Expense
            {
                Amount = dto.Amount,
                Method = Normalize(dto.Method),
                Description = (dto.Description ?? string.Empty).Trim(),
                Category = (dto.Category ?? string.Empty).Trim(),
                ReceiptImage = (dto.ReceiptImage ?? string.Empty).Trim(),
                Date = DateTime.UtcNow,
                GroupId = scoped,
                VendorId = dto.VendorId,
            };
            await _expenses.AddAsync(expense);
            _logger.LogInformation("Expense created (Id: {ExpenseId}, Group: {GroupId})",
                expense.Id, expense.GroupId);
            return ToResponse(expense);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var expense = await _expenses.GetByIdAsync(id);
            // בעלות: אפשר למחוק רק הוצאה של גן שבבעלות המשתמש (IDOR)
            if (expense == null || !await _access.CanAccessGroupAsync(expense.GroupId))
            {
                return false;
            }
            // הרשאת עריכה: "צופה" אינו רשאי למחוק נתונים
            if (!await _access.CanEditGroupAsync(expense.GroupId)) throw new ForbiddenException();
            // מחיקה רכה: לסל המיחזור במקום מחיקה מיידית — ניתן לשחזר 30 יום.
            expense.IsDeleted = true;
            expense.DeletedAt = DateTime.UtcNow;
            await _expenses.UpdateAsync(expense);
            _logger.LogInformation("Expense moved to trash (Id: {ExpenseId})", id);
            return true;
        }

        public async Task<List<ExpenseResponseDto>> GetTrashAsync(int? groupId = null)
        {
            var scoped = await _access.ScopeGroupIdAsync(groupId);
            if (scoped == null)
            {
                return new List<ExpenseResponseDto>();
            }
            var cutoff = DateTime.UtcNow.AddDays(-TrashRetentionDays);
            // IgnoreQueryFilters — כדי לראות דווקא את המחוקים (המסנן הגלובלי מסתיר אותם).
            var trash = await _db.Expenses
                .IgnoreQueryFilters()
                .Where(e => e.IsDeleted && e.GroupId == scoped.Value && e.DeletedAt >= cutoff)
                .OrderByDescending(e => e.DeletedAt)
                .AsNoTracking()
                .ToListAsync();
            return trash.Select(ToResponse).ToList();
        }

        public async Task<bool> RestoreAsync(int id)
        {
            var expense = await _db.Expenses
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.Id == id);
            if (expense == null || !expense.IsDeleted ||
                !await _access.CanAccessGroupAsync(expense.GroupId))
            {
                return false;
            }
            if (!await _access.CanEditGroupAsync(expense.GroupId)) throw new ForbiddenException();
            expense.IsDeleted = false;
            expense.DeletedAt = null;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Expense restored from trash (Id: {ExpenseId})", id);
            return true;
        }

        public async Task<bool> PermanentDeleteAsync(int id)
        {
            var expense = await _db.Expenses
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.Id == id);
            // מוחקים לצמיתות רק פריט שכבר בסל המיחזור (הגנה מפני מחיקת פעיל בטעות).
            if (expense == null || !expense.IsDeleted ||
                !await _access.CanAccessGroupAsync(expense.GroupId))
            {
                return false;
            }
            if (!await _access.CanEditGroupAsync(expense.GroupId)) throw new ForbiddenException();
            _db.Expenses.Remove(expense);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Expense permanently deleted (Id: {ExpenseId})", id);
            return true;
        }

        /* אמצעי לא-חוקי נשמר כ-"cash" כברירת מחדל בטוחה */
        private static string Normalize(string method)
        {
            var m = (method ?? string.Empty).Trim().ToLowerInvariant();
            return AllowedMethods.Contains(m) ? m : "cash";
        }

        private static ExpenseResponseDto ToResponse(Expense e) => new()
        {
            Id = e.Id,
            Amount = e.Amount,
            Method = e.Method,
            Description = e.Description,
            Category = e.Category,
            ReceiptImage = e.ReceiptImage,
            Date = e.Date,
            VendorId = e.VendorId,
            DeletedAt = e.DeletedAt,
        };
    }
}
