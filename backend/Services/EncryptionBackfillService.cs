using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.Auth;

namespace ParentCommitteeAPI.Services
{
    /*
      IEncryptionBackfillService — הצפנת רשומות שנשמרו **לפני** שההצפנה הופעלה.

      הבעיה שזה פותר: ההצפנה חלה על כל שמירה מרגע הפעלת המפתח, אבל תלמידים
      שכבר היו במסד נשארים כטקסט גלוי עד שמישהו יערוך אותם וישמור. כלומר בלי
      פעולה יזומה, דווקא הנתונים הוותיקים — שהם רוב הנתונים — נשארים חשופים.

      בטיחות:
      • `FieldEncryption.Protect` **מדלג על ערך שכבר מוצפן**, ולכן הרצה חוזרת
        אינה מזיקה ואינה מצפינה פעמיים.
      • ריצה בטרנזקציה אחת — או שהכול נשמר, או ששום דבר לא משתנה.
      • בלי מפתח הפעולה מסרבת לרוץ, כדי שלא ייווצר מצב של "הצפנתי" בלי מפתח.
      • גיבוי אוטומטי רץ בכל עליית שרת, כך שקיים עותק מלפני הפעולה.
    */
    public interface IEncryptionBackfillService
    {
        /* כמה תלמידים עדיין שמורים כטקסט גלוי (0 = הכול מוצפן). */
        Task<int> CountPendingAsync();

        /* מצפין את מה שנותר. מחזיר כמה רשומות עודכנו. */
        Task<int> RunAsync();
    }

    public class EncryptionBackfillService : IEncryptionBackfillService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<EncryptionBackfillService> _logger;

        public EncryptionBackfillService(
            AppDbContext db, ILogger<EncryptionBackfillService> logger)
        {
            _db = db;
            _logger = logger;
        }

        /*
          רשומה נחשבת "ממתינה" אם יש בה ערך רגיש כלשהו שאינו מוצפן. שדה ריק
          אינו נחשב — אין מה להצפין בו.
        */
        private static bool NeedsEncryption(Models.Student s) =>
            IsPlain(s.Allergies) || IsPlain(s.Address) || IsPlain(s.ParentPhoneNumber)
            || IsPlain(s.ParentEmail) || IsPlain(s.ParentBPhone) || IsPlain(s.ParentBEmail);

        private static bool IsPlain(string? value) =>
            !string.IsNullOrEmpty(value) && !FieldEncryption.IsEncrypted(value);

        public async Task<int> CountPendingAsync()
        {
            if (!FieldEncryption.IsEnabled)
            {
                return 0;
            }
            // הבדיקה היא על תוכן המחרוזת ולכן נעשית בזיכרון; מספר התלמידים
            // במערכת קטן (עשרות עד מאות לגן), כך שזה זניח.
            var students = await _db.Students.AsNoTracking().ToListAsync();
            var pending = students.Count(NeedsEncryption);
            _logger.LogInformation(
                "Backfill scan: {Total} students, {Pending} pending, encryption {State}",
                students.Count, pending, FieldEncryption.IsEnabled ? "on" : "off");
            return pending;
        }

        public async Task<int> RunAsync()
        {
            if (!FieldEncryption.IsEnabled)
            {
                throw new InvalidOperationException(
                    "ההצפנה כבויה — יש להגדיר את מפתח ההצפנה לפני הפעלת הפעולה.");
            }

            var students = await _db.Students.ToListAsync();
            var pending = students.Where(NeedsEncryption).ToList();
            if (pending.Count == 0)
            {
                return 0;
            }

            await using var tx = await _db.Database.BeginTransactionAsync();
            foreach (var s in pending)
            {
                s.Allergies = FieldEncryption.Protect(s.Allergies);
                s.Address = FieldEncryption.Protect(s.Address);
                s.ParentPhoneNumber = FieldEncryption.Protect(s.ParentPhoneNumber);
                s.ParentEmail = FieldEncryption.Protect(s.ParentEmail);
                s.ParentBPhone = FieldEncryption.Protect(s.ParentBPhone);
                s.ParentBEmail = FieldEncryption.Protect(s.ParentBEmail);
            }
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            /*
              קריטי: SQLite שומר את הגרסה הישנה של השורה ביומן הכתיבה (WAL) עד
              לנקודת ביקורת. בלי השורה הבאה, הערך הגלוי שהרגע הצפַנּו ממשיך
              לשכב על הדיסק בקובץ ה-WAL — כלומר הפעולה נראית מוצלחת אבל לא
              משיגה את מטרתה. TRUNCATE מכווץ את היומן ומסיר את העותק הישן.
            */
            try
            {
                await _db.Database.ExecuteSqlRawAsync("PRAGMA wal_checkpoint(TRUNCATE);");
            }
            catch (Exception ex)
            {
                // ההצפנה עצמה הצליחה; כישלון ניקוי היומן אינו מבטל אותה
                _logger.LogWarning(ex, "WAL checkpoint after backfill failed");
            }

            _logger.LogInformation(
                "Encryption backfill completed ({Count} students)", pending.Count);
            return pending.Count;
        }
    }
}
