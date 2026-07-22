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
        private static readonly HashSet<string> AllowedMethods = new() { "bit", "paybox", "cash" };

        private readonly IRepository<Expense> _expenses;
        private readonly IAccessScope _access;
        private readonly ILogger<ExpenseService> _logger;

        public ExpenseService(
            IRepository<Expense> expenses, IAccessScope access, ILogger<ExpenseService> logger)
        {
            _expenses = expenses;
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
            var expenses = (await _expenses.GetAllAsync())
                .Where(e => e.GroupId == scoped.Value)
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
                Date = DateTime.UtcNow,
                GroupId = scoped,
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
            await _expenses.DeleteAsync(expense);
            _logger.LogInformation("Expense deleted (Id: {ExpenseId})", id);
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
            Date = e.Date,
        };
    }
}
