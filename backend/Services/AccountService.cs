using Microsoft.EntityFrameworkCore;

namespace ParentCommitteeAPI.Services
{
    /*
      AccountService — מחיקת חשבון וכל הנתונים התלויים בו ("הזכות להימחק").

      חלק מהישויות (Students/StaffMembers/Expenses/Gifts/Events/DriveFolders)
      מקושרות לגן ב-GroupId *אופציונלי*, ולכן מחיקת הגן הייתה רק מאפסת אותן
      (SetNull) ולא מוחקת — לכן מוחקים במפורש את כל מה ששייך לגנים של המשתמש,
      בסדר שמכבד מפתחות זרים: קודם תשלומים, אחר כך שאר הישויות, ואז הגנים,
      ולבסוף המשתמש. הכל בטרנזקציה אחת — או שהכל נמחק, או כלום.
    */
    public class AccountService : IAccountService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<AccountService> _logger;

        public AccountService(AppDbContext db, ILogger<AccountService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<bool> DeleteAccountAsync(int userId)
        {
            var groupIds = await _db.Groups
                .Where(g => g.UserId == userId)
                .Select(g => g.Id)
                .ToListAsync();

            await using var tx = await _db.Database.BeginTransactionAsync();

            if (groupIds.Count > 0)
            {
                var studentIds = await _db.Students
                    .Where(s => s.GroupId != null && groupIds.Contains(s.GroupId.Value))
                    .Select(s => s.Id)
                    .ToListAsync();
                var categoryIds = await _db.CollectionCategories
                    .Where(c => groupIds.Contains(c.GroupId))
                    .Select(c => c.Id)
                    .ToListAsync();

                // 1) תשלומים (מצביעים על תלמידים וקטגוריות) — נמחקים ראשונים
                await _db.Payments
                    .Where(p => studentIds.Contains(p.StudentId)
                             || categoryIds.Contains(p.CollectionCategoryId))
                    .ExecuteDeleteAsync();

                // 2) כל הישויות התלויות בגנים של המשתמש
                await _db.Students.Where(s => s.GroupId != null && groupIds.Contains(s.GroupId.Value)).ExecuteDeleteAsync();
                await _db.StaffMembers.Where(s => s.GroupId != null && groupIds.Contains(s.GroupId.Value)).ExecuteDeleteAsync();
                await _db.Expenses.Where(e => e.GroupId != null && groupIds.Contains(e.GroupId.Value)).ExecuteDeleteAsync();
                await _db.Gifts.Where(g => g.GroupId != null && groupIds.Contains(g.GroupId.Value)).ExecuteDeleteAsync();
                await _db.Events.Where(e => e.GroupId != null && groupIds.Contains(e.GroupId.Value)).ExecuteDeleteAsync();
                await _db.DriveFolders.Where(d => d.GroupId != null && groupIds.Contains(d.GroupId.Value)).ExecuteDeleteAsync();
                await _db.CollectionCategories.Where(c => groupIds.Contains(c.GroupId)).ExecuteDeleteAsync();

                // 3) הגנים עצמם
                await _db.Groups.Where(g => g.UserId == userId).ExecuteDeleteAsync();
            }

            // 4) המשתמש
            var deleted = await _db.Users.Where(u => u.Id == userId).ExecuteDeleteAsync();

            await tx.CommitAsync();
            _logger.LogInformation("Account deleted (UserId: {UserId}, Groups: {GroupCount})",
                userId, groupIds.Count);
            return deleted > 0;
        }
    }
}
