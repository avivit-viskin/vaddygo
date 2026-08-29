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
        private readonly IConfiguration _config;

        public AccountService(AppDbContext db, ILogger<AccountService> logger,
            IConfiguration config)
        {
            _db = db;
            _logger = logger;
            _config = config;
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
          מחיקת גן בודד ע"י המנהלת (ניקוי גני-בדיקה). מוחק את הגן ואת כל הנתונים
          התלויים בו — *בלי* לגעת בחשבון עצמו. כך אפשר לנקות גן בודד גם מחשבון עם
          כמה גנים וגם מחשבון המנהלת, בלי נעילה-עצמית ובלי לפגוע בגנים אחרים.
          אם לבעלים (שאינו מנהלת) לא נשארו גנים — מוחקים גם את חשבון-הבדיקה היתום.

          ⚠️ רשימת הטבלאות עם GroupId חייבת להישאר תואמת ל-DeleteAccountAsync.
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

            /*
              חשבון מוגן (בוט הבדיקות) — לא נמחק גם מהמסך של המנהלת. הבוט נראה
              במסך בדיוק כמו גן-בדיקה, ולחיצה אחת מוטעית משביתה את בדיקות ה-E2E
              בלי שאיש ישים לב. ראה ProtectedAccounts.
            */
            var owningUser = await _db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == ownerId);
            if (ProtectedAccounts.IsProtectedUser(owningUser, _config))
            {
                return CommitteeDeleteResult.ProtectedAccount;
            }

            await using var tx = await _db.Database.BeginTransactionAsync();

            var studentIds = await _db.Students
                .Where(s => s.GroupId == groupId).Select(s => s.Id).ToListAsync();
            var categoryIds = await _db.CollectionCategories
                .Where(c => c.GroupId == groupId).Select(c => c.Id).ToListAsync();
            var pollIds = await _db.Polls
                .Where(p => p.GroupId == groupId).Select(p => p.Id).ToListAsync();

            // קודם מה שמצביע על אחרים (תשלומים/הצבעות), ואז ההורים שלהם
            await _db.Payments
                .Where(p => studentIds.Contains(p.StudentId)
                         || categoryIds.Contains(p.CollectionCategoryId))
                .ExecuteDeleteAsync();
            await _db.Students.Where(s => s.GroupId == groupId).ExecuteDeleteAsync();
            await _db.StaffMembers.Where(s => s.GroupId == groupId).ExecuteDeleteAsync();
            await _db.Expenses.Where(e => e.GroupId == groupId).ExecuteDeleteAsync();
            await _db.Gifts.Where(g => g.GroupId == groupId).ExecuteDeleteAsync();
            await _db.Events.Where(e => e.GroupId == groupId).ExecuteDeleteAsync();
            await _db.DriveFolders.Where(d => d.GroupId == groupId).ExecuteDeleteAsync();
            await _db.CollectionCategories.Where(c => c.GroupId == groupId).ExecuteDeleteAsync();
            await _db.PollVotes.Where(v => pollIds.Contains(v.PollId)).ExecuteDeleteAsync();
            await _db.PollOptions.Where(o => pollIds.Contains(o.PollId)).ExecuteDeleteAsync();
            await _db.Polls.Where(p => p.GroupId == groupId).ExecuteDeleteAsync();
            await _db.Leads.Where(l => l.GroupId == groupId).ExecuteDeleteAsync();
            await _db.GroupMembers.Where(m => m.GroupId == groupId).ExecuteDeleteAsync();
            await _db.GroupInvites.Where(i => i.GroupId == groupId).ExecuteDeleteAsync();
            await _db.Groups.Where(g => g.Id == groupId).ExecuteDeleteAsync();

            // חשבון-בדיקה יתום (רגיל, בלי גנים נוספים) — מוחקים גם אותו. מנהלת נשמרת.
            var owner = await _db.Users.FirstOrDefaultAsync(u => u.Id == ownerId);
            var ownerHasGroups = await _db.Groups.AnyAsync(g => g.UserId == ownerId);
            if (owner != null && !ownerHasGroups && owner.Role != "SuperAdmin")
            {
                await _db.GroupMembers.Where(m => m.UserId == ownerId).ExecuteDeleteAsync();
                await _db.TwoFactorChallenges.Where(c => c.UserId == ownerId).ExecuteDeleteAsync();
                await _db.TwoFactorBackupCodes.Where(c => c.UserId == ownerId).ExecuteDeleteAsync();
                await _db.TrustedDevices.Where(d => d.UserId == ownerId).ExecuteDeleteAsync();
                await _db.Users.Where(u => u.Id == ownerId).ExecuteDeleteAsync();
            }

            await tx.CommitAsync();
            _logger.LogInformation("Committee deleted by admin (GroupId: {GroupId})", groupId);
            return CommitteeDeleteResult.Deleted;
        }

        /*
          מחיקת "נרשם שלא השלים" (משתמש ללא אף ועד) ע"י המנהלת — לניקוי
          חשבונות-בדיקה שנעצרו באשף. בטוח: מסרב לחשבון מנהלת ולמשתמש שיש לו ועד
          (את אלה מוחקים דרך מחיקת הגן). המחיקה עצמה דרך DeleteAccountAsync.
        */
        public async Task<IncompleteUserDeleteResult> DeleteIncompleteUserAsync(int userId)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return IncompleteUserDeleteResult.NotFound;
            }
            if (user.Role == "SuperAdmin")
            {
                return IncompleteUserDeleteResult.ProtectedAdmin;
            }
            // חשבון מוגן (בוט הבדיקות) — ראה ProtectedAccounts
            if (ProtectedAccounts.IsProtectedUser(user, _config))
            {
                return IncompleteUserDeleteResult.ProtectedAccount;
            }
            var hasGroup = await _db.Groups.AnyAsync(g => g.UserId == userId);
            if (hasGroup)
            {
                return IncompleteUserDeleteResult.HasGroup;
            }

            await DeleteAccountAsync(userId);
            _logger.LogInformation("Incomplete signup deleted by admin (UserId: {UserId})", userId);
            return IncompleteUserDeleteResult.Deleted;
        }
    }
}
