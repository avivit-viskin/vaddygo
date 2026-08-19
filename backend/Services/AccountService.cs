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

        /*
          מחיקת חשבון ("הזכות להימחק") — מוחקת את המשתמש ואת **כל** הנתונים
          התלויים בגנים שבבעלותו, בטרנזקציה אחת.

          ⚠️ כלל מחייב: **כל טבלה חדשה שיש בה `GroupId` חייבת להתווסף כאן.**
          טבלה שנשכחת לא גורמת לשגיאה — היא פשוט משאירה נתונים אישיים במסד אחרי
          שהלקוחה ביקשה למחוק אותם. כך בדיוק נשכחו הסקרים והפניות עד 10.08.2026.
          סדר המחיקה: קודם מה שמצביע על אחרים (תשלומים/הצבעות), ואז ההורים שלהם.
        */
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
                var pollIds = await _db.Polls
                    .Where(p => p.GroupId != null && groupIds.Contains(p.GroupId.Value))
                    .Select(p => p.Id)
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

                // סקרים: ההצבעות והאפשרויות מצביעות על הסקר, ולכן נמחקות לפניו.
                // שאלת הסקר וההצבעות הן נתוני הוועד ונמחקות איתו.
                await _db.PollVotes.Where(v => pollIds.Contains(v.PollId)).ExecuteDeleteAsync();
                await _db.PollOptions.Where(o => pollIds.Contains(o.PollId)).ExecuteDeleteAsync();
                await _db.Polls.Where(p => pollIds.Contains(p.Id)).ExecuteDeleteAsync();

                // פניות שהוועד שלח לספקים — מכילות את פרטי הקשר של הוועד, ולכן
                // הן נתוניו ונמחקות. הספק עצמו אינו נמחק (הוא לקוח נפרד).
                await _db.Leads.Where(l => l.GroupId != null && groupIds.Contains(l.GroupId.Value)).ExecuteDeleteAsync();

                // חברויות והזמנות של הגנים של המשתמש — אחרת נשארות רשומות יתומות
                // (עם שם/הרשאה) גם אחרי מחיקת הגן ("הזכות להימחק" לא מלאה).
                await _db.GroupMembers.Where(m => groupIds.Contains(m.GroupId)).ExecuteDeleteAsync();
                await _db.GroupInvites.Where(i => groupIds.Contains(i.GroupId)).ExecuteDeleteAsync();

                // 3) הגנים עצמם
                await _db.Groups.Where(g => g.UserId == userId).ExecuteDeleteAsync();
            }

            // חברויות של המשתמש עצמו בגנים של אחרים — גם אלה נתוני המשתמש שנמחקים
            await _db.GroupMembers.Where(m => m.UserId == userId).ExecuteDeleteAsync();

            // נספחי האימות הדו-שלבי. אין להם משמעות בלי המשתמש, ומכשיר זכור
            // שנשאר יתום היה מזוהה עם מזהה משתמש שעשוי להינתן שוב בעתיד.
            await _db.TwoFactorChallenges.Where(c => c.UserId == userId).ExecuteDeleteAsync();
            await _db.TwoFactorBackupCodes.Where(c => c.UserId == userId).ExecuteDeleteAsync();
            await _db.TrustedDevices.Where(d => d.UserId == userId).ExecuteDeleteAsync();

            // 4) המשתמש
            var deleted = await _db.Users.Where(u => u.Id == userId).ExecuteDeleteAsync();

            await tx.CommitAsync();
            _logger.LogInformation("Account deleted (UserId: {UserId}, Groups: {GroupCount})",
                userId, groupIds.Count);
            return deleted > 0;
        }

        /*
          מחיקת גן ע"י המנהלת (ניקוי גני-בדיקה). מוחקים רק גן יחיד של חשבון רגיל
          — שזה בדיוק המבנה של חשבון-בדיקה — ואז מוחקים את החשבון כולו דרך
          DeleteAccountAsync (הלוגיקה המתוחזקת שמוחקת הכל). מסרבים לחשבון מנהלת
          (הגנה מפני נעילה-עצמית) ולחשבון עם כמה גנים (סיכון למחוק גן אמיתי).
        */
        public async Task<CommitteeDeleteResult> DeleteCommitteeAsync(int groupId)
        {
            var group = await _db.Groups.AsNoTracking()
                .FirstOrDefaultAsync(g => g.Id == groupId);
            if (group == null)
            {
                return CommitteeDeleteResult.NotFound;
            }

            var ownerId = group.UserId;
            var owner = await _db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == ownerId);
            if (owner != null && owner.Role == "SuperAdmin")
            {
                return CommitteeDeleteResult.ProtectedAdmin;
            }

            var groupCount = await _db.Groups.CountAsync(g => g.UserId == ownerId);
            if (groupCount > 1)
            {
                return CommitteeDeleteResult.HasMultiple;
            }

            await DeleteAccountAsync(ownerId);
            _logger.LogInformation("Committee deleted by admin (GroupId: {GroupId})", groupId);
            return CommitteeDeleteResult.Deleted;
        }
    }
}
