using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      GroupService — הלוגיקה העסקית של הגדרת הגן מאשף ההרשמה:
      שמירת הגן עם קטגוריות הגבייה שלו, וחישוב יעד הגבייה בשרת
      (סה"כ לתלמיד × מספר ילדים). ניגש ל-DbContext ישירות (ולא דרך
      ה-Repository הגנרי) כי גן נטען תמיד יחד עם הקטגוריות שלו (Include).
    */
    public class GroupService : IGroupService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<GroupService> _logger;

        public GroupService(AppDbContext db, ILogger<GroupService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<List<GroupResponseDto>> GetAllAsync()
        {
            var groups = await _db.Groups.Include(g => g.Categories).ToListAsync();
            return groups.Select(ToResponse).ToList();
        }

        public async Task<GroupResponseDto?> GetByIdAsync(int id)
        {
            var group = await _db.Groups
                .Include(g => g.Categories)
                .FirstOrDefaultAsync(g => g.Id == id);
            return group == null ? null : ToResponse(group);
        }

        public async Task<GroupResponseDto> CreateAsync(GroupCreateDto dto)
        {
            var group = new Group
            {
                Name = dto.Name.Trim(),
                City = dto.City.Trim(),
                Year = dto.Year ?? SchoolYear.Current(),
                ChildrenCount = dto.ChildrenCount,
                StaffCount = dto.StaffCount,
                Subgroups = string.Join(",", dto.Subgroups.Select(s => s.Trim()).Where(s => s.Length > 0)),
                Categories = dto.Categories.Select(c => new CollectionCategory
                {
                    Name = c.Name.Trim(),
                    AmountPerChild = c.AmountPerChild,
                    Installments = c.Installments,
                }).ToList(),
            };

            _db.Groups.Add(group);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Group created (Id: {GroupId}, Categories: {CategoryCount})",
                group.Id, group.Categories.Count);
            return ToResponse(group);
        }

        public async Task<GroupResponseDto?> UpdatePaymentLinksAsync(int id, GroupPaymentLinksDto dto)
        {
            var group = await _db.Groups
                .Include(g => g.Categories)
                .FirstOrDefaultAsync(g => g.Id == id);
            if (group == null)
            {
                return null;
            }

            // מחרוזת ריקה נשמרת כ-null (== "לא הוגדר")
            group.BitLink = string.IsNullOrWhiteSpace(dto.BitLink) ? null : dto.BitLink.Trim();
            group.PayboxLink = string.IsNullOrWhiteSpace(dto.PayboxLink) ? null : dto.PayboxLink.Trim();
            await _db.SaveChangesAsync();
            _logger.LogInformation("Group payment links updated (Id: {GroupId})", id);
            return ToResponse(group);
        }

        /*
          עדכון קטגוריות הגבייה של גן קיים — כדי להגדיר/לתקן סכומים ומספר תשלומים
          אחרי ההרשמה.

          ‼️ קריטי: אסור למחוק את כל הקטגוריות וליצור חדשות. תשלומי התלמידים
          מקושרים לקטגוריה ב-FK עם ON DELETE CASCADE — מחיקת קטגוריה מוחקת איתה
          את כל התשלומים שנרשמו לה. לכן מעדכנים קטגוריות קיימות *במקומן* (ה-Id
          נשמר → התשלומים נשמרים), מוסיפים חדשות, ומוחקים רק קטגוריות שהוסרו
          בפועל מהרשימה (התשלומים שלהן נמחקים איתן — וזה מכוון, הקטגוריה בוטלה).
          ההתאמה בין ישן לחדש היא לפי שם הקטגוריה.
        */
        public async Task<GroupResponseDto?> UpdateCategoriesAsync(int id, GroupCategoriesUpdateDto dto)
        {
            var group = await _db.Groups
                .Include(g => g.Categories)
                .FirstOrDefaultAsync(g => g.Id == id);
            if (group == null)
            {
                return null;
            }

            var incoming = dto.Categories
                .Select(c => new { Name = c.Name.Trim(), c.AmountPerChild, c.Installments })
                .Where(c => c.Name.Length > 0)
                .ToList();
            var incomingNames = incoming.Select(c => c.Name).ToHashSet();
            var existingCategories = group.Categories.ToList();

            // מוחקים רק קטגוריות שהוסרו מהרשימה (התשלומים שלהן נמחקים איתן ב-cascade)
            var toRemove = existingCategories.Where(c => !incomingNames.Contains(c.Name)).ToList();
            _db.CollectionCategories.RemoveRange(toRemove);

            foreach (var inc in incoming)
            {
                var match = existingCategories.FirstOrDefault(c => c.Name == inc.Name);
                if (match != null)
                {
                    // עדכון במקום — ה-Id נשמר, ולכן התשלומים המקושרים אליו נשמרים
                    match.AmountPerChild = inc.AmountPerChild;
                    match.Installments = inc.Installments;
                }
                else
                {
                    group.Categories.Add(new CollectionCategory
                    {
                        Name = inc.Name,
                        AmountPerChild = inc.AmountPerChild,
                        Installments = inc.Installments,
                    });
                }
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation("Group categories updated (Id: {GroupId}, Categories: {CategoryCount})",
                id, incoming.Count);

            // טוענים מחדש כדי שה-Response ישקף בדיוק את שנשמר (בלי קטגוריות שנמחקו)
            var refreshed = await _db.Groups
                .Include(g => g.Categories)
                .FirstAsync(g => g.Id == id);
            return ToResponse(refreshed);
        }

        /* עדכון תקציבי החגים של הוועד — הדיקשנרי כולו נשמר כ-JSON ברמת הגן. */
        public async Task<GroupResponseDto?> UpdateHolidayBudgetsAsync(int id, Dictionary<string, decimal> budgets)
        {
            var group = await _db.Groups
                .Include(g => g.Categories)
                .FirstOrDefaultAsync(g => g.Id == id);
            if (group == null)
            {
                return null;
            }

            group.HolidayBudgetsJson = (budgets == null || budgets.Count == 0)
                ? null
                : JsonSerializer.Serialize(budgets);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Group holiday budgets updated (Id: {GroupId}, Count: {Count})",
                id, budgets?.Count ?? 0);
            return ToResponse(group);
        }

        private static Dictionary<string, decimal> ParseHolidayBudgets(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return new();
            }
            try
            {
                return JsonSerializer.Deserialize<Dictionary<string, decimal>>(json) ?? new();
            }
            catch
            {
                return new();
            }
        }

        private static GroupResponseDto ToResponse(Group group)
        {
            var totalPerChild = group.Categories.Sum(c => c.AmountPerChild);
            return new GroupResponseDto
            {
                Id = group.Id,
                Name = group.Name,
                City = group.City,
                Year = group.Year,
                ChildrenCount = group.ChildrenCount,
                StaffCount = group.StaffCount,
                Subgroups = group.Subgroups.Length == 0
                    ? new List<string>()
                    : group.Subgroups.Split(',').ToList(),
                Categories = group.Categories.Select(c => new CollectionCategoryResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    AmountPerChild = c.AmountPerChild,
                    Installments = c.Installments,
                }).ToList(),
                TotalPerChild = totalPerChild,
                CollectionGoal = totalPerChild * group.ChildrenCount,
                BitLink = group.BitLink,
                PayboxLink = group.PayboxLink,
                HolidayBudgets = ParseHolidayBudgets(group.HolidayBudgetsJson),
            };
        }
    }
}
