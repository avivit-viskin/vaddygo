using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Student> Students { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<Budget> Budgets { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<CollectionCategory> CollectionCategories { get; set; }
        public DbSet<StaffMember> StaffMembers { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Vendor> Vendors { get; set; }
        public DbSet<VendorProduct> VendorProducts { get; set; }
        public DbSet<VendorSocialLink> VendorSocialLinks { get; set; }
        public DbSet<Gift> Gifts { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<DriveFolder> DriveFolders { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }
        public DbSet<GroupInvite> GroupInvites { get; set; }
        public DbSet<Poll> Polls { get; set; }
        public DbSet<PollOption> PollOptions { get; set; }
        public DbSet<PollVote> PollVotes { get; set; }
        public DbSet<Lead> Leads { get; set; }
        public DbSet<VendorReview> VendorReviews { get; set; }

        // צפיות בכרטיס הספק לפי יום — הבסיס להשוואת תקופות בדוח הספק
        public DbSet<VendorViewDay> VendorViewDays { get; set; }

        // כוונת רכישת פרו — מקשרת בין לחיצת התשלום ל-webhook של GROW (שורד אתחול)
        public DbSet<PendingProIntent> PendingProIntents { get; set; }

        // כתובות שהוסרו מרשימת התפוצה (ברודקאסט) — מוחרגות מכל שליחה
        public DbSet<EmailOptOut> EmailOptOuts { get; set; }

        // אימות דו-שלבי: אתגר פתוח, קודי גיבוי, ומכשירים שנזכרו
        public DbSet<TwoFactorChallenge> TwoFactorChallenges { get; set; }
        public DbSet<TwoFactorBackupCode> TwoFactorBackupCodes { get; set; }
        public DbSet<TrustedDevice> TrustedDevices { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            /*
              אינדקסים על GroupId — עמודת הסינון של כל מסך במערכת.

              🔴 נוספו אחרי מדידת קיבולת (02.09.2026): כל שליפה לפי גן סרקה את
              הטבלה כולה. על 50,000 הוצאות אותה שאילתה ירדה מ-67ms ל-2ms.
              Students ו-StaffMembers כבר היו מאונדקסים; אלה שנשארו מאחור.
            */
            modelBuilder.Entity<Expense>().HasIndex(e => e.GroupId);
            modelBuilder.Entity<Event>().HasIndex(e => e.GroupId);
            modelBuilder.Entity<Gift>().HasIndex(g => g.GroupId);
            modelBuilder.Entity<DriveFolder>().HasIndex(d => d.GroupId);
            modelBuilder.Entity<Poll>().HasIndex(p => p.GroupId);
            modelBuilder.Entity<Lead>().HasIndex(l => l.GroupId);

            // בדיקת הבעלות שרצה בכל בקשה מאומתת ("אילו גנים שייכים למשתמש").
            modelBuilder.Entity<Group>().HasIndex(g => g.UserId);

            // המייל הוא הזהות הייחודית (החלטת בעלת המוצר): שם משתמש יכול לחזור
            // על עצמו בין לקוחות — לכן אינדקס רגיל בלבד; המייל חייב להיות ייחודי.
            modelBuilder.Entity<User>().HasIndex(u => u.Username);
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

            // חברוּת ייחודית לכל (גן, משתמש); טוקן הזמנה ייחודי לחיפוש מהיר.
            modelBuilder.Entity<GroupMember>().HasIndex(m => new { m.GroupId, m.UserId }).IsUnique();
            modelBuilder.Entity<GroupInvite>().HasIndex(i => i.Token).IsUnique();

            // כתובת הסקר הציבורית — ייחודית ומאונדקסת (כל פתיחת קישור מחפשת לפיה).
            modelBuilder.Entity<Poll>().HasIndex(p => p.PublicToken).IsUnique();
            // האפשרויות נמחקות יחד עם הסקר — אין להן חיים משל עצמן.
            modelBuilder.Entity<Poll>()
                .HasMany(p => p.Options)
                .WithOne(o => o.Poll!)
                .HasForeignKey(o => o.PollId)
                .OnDelete(DeleteBehavior.Cascade);
            // הצבעה אחת לכל מצביע בכל סקר — הבסיס למניעת הצבעה כפולה בטעות.
            modelBuilder.Entity<PollVote>()
                .HasIndex(v => new { v.PollId, v.VoterKey }).IsUnique();

            // תיבת הפניות של הספק נשלפת לפי VendorId — אינדקס לשליפה מהירה.
            modelBuilder.Entity<Lead>().HasIndex(l => l.VendorId);

            // ביקורות הספק — שליפה לפי VendorId, וביקורת אחת בלבד לכל (ספק, מוסד).
            modelBuilder.Entity<VendorReview>().HasIndex(r => r.VendorId);
            modelBuilder.Entity<VendorReview>()
                .HasIndex(r => new { r.VendorId, r.GroupId }).IsUnique();

            // "סל מיחזור": הוצאה מחוקה-רכה מוסתרת אוטומטית מכל שאילתה רגילה (מסנן
            // גלובלי). שאילתות סל-המיחזור מבטלות אותו ב-IgnoreQueryFilters().
            modelBuilder.Entity<Expense>().HasQueryFilter(e => !e.IsDeleted);

            // כתובת אחת ברשימת המוסרים — ייחודי מונע כפילויות בהסרה חוזרת.
            modelBuilder.Entity<EmailOptOut>().HasIndex(o => o.Email).IsUnique();

            // אימות דו-שלבי: כל שלוש הטבלאות נשלפות לפי טביעת אצבע או לפי משתמש,
            // ובשתי הראשונות זה קורה בתוך זרימת התחברות — לכן אינדקס ייחודי.
            modelBuilder.Entity<TwoFactorChallenge>()
                .HasIndex(c => c.ChallengeFingerprint).IsUnique();
            modelBuilder.Entity<TrustedDevice>()
                .HasIndex(d => d.TokenFingerprint).IsUnique();
            modelBuilder.Entity<TwoFactorBackupCode>()
                .HasIndex(c => new { c.UserId, c.CodeFingerprint }).IsUnique();

            // צפייה אחת לכל (ספק, יום). האינדקס הייחודי הוא שמונע שתי שורות
            // לאותו יום כששתי בקשות מגיעות יחד — ולא רק מאיץ שליפה.
            modelBuilder.Entity<VendorViewDay>()
                .HasIndex(v => new { v.VendorId, v.Day }).IsUnique();
        }

        /*
          ישויות ששייכות לגן (יש להן GroupId) אך אינן נחשבות "עריכת נתוני הגן":
          פניות/ביקורות של ספקים, חברוּת והזמנות צוות, וכוונת רכישת פרו — אלה
          פעולות סביב הגן, ולא עריכה של תוכנו. הן לא מעדכנות את LastEditedAt.
        */
        private static readonly HashSet<string> _nonEditGroupEntities = new()
        {
            nameof(Lead), nameof(VendorReview), nameof(GroupMember),
            nameof(GroupInvite), nameof(PendingProIntent),
        };

        /*
          עדכון אוטומטי של Group.LastEditedAt: כל שמירה שכוללת יצירה/עריכה של
          ישות ששייכת לגן (תלמיד, קטגוריה, הוצאה, אירוע, מתנה, צוות, תיקייה,
          סקר) או עריכה של הגן עצמו — מסמנת את הגן כ"נערך עכשיו". כך המנהלת רואה
          בנתוני שימוש אילו מוסדות פעילים, בלי לתחזק חותמת ידנית בכל שירות.

          נעשה אחרי base.SaveChangesAsync בעדכון ישיר (ExecuteUpdate) ובתוך
          try — חותמת המעקב לעולם לא מפילה שמירה אמיתית.
        */
        public override async Task<int> SaveChangesAsync(
            CancellationToken cancellationToken = default)
        {
            var groupIds = CollectEditedGroupIds();
            var result = await base.SaveChangesAsync(cancellationToken);
            if (groupIds.Count > 0)
            {
                try
                {
                    var now = DateTime.UtcNow;
                    await Groups
                        .Where(g => groupIds.Contains(g.Id))
                        .ExecuteUpdateAsync(
                            s => s.SetProperty(g => g.LastEditedAt, now),
                            cancellationToken);
                }
                catch
                {
                    // מדד בלבד — לא מפילים את השמירה האמיתית בגלל כשל בחותמת.
                }
            }
            return result;
        }

        // אילו גנים נגעו בשמירה הנוכחית (יצירה/עריכה של ישות-גן, או עריכת הגן
        // עצמו). נאסף *לפני* base.SaveChangesAsync כי אחריה המצבים מתאפסים.
        private List<int> CollectEditedGroupIds()
        {
            var ids = new HashSet<int>();
            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.State != EntityState.Added && entry.State != EntityState.Modified)
                {
                    continue;
                }
                if (entry.Entity is Group group)
                {
                    // עריכת הגן עצמו (שם/קישורים/תקציבים...) — אך לא עצם יצירתו.
                    if (entry.State == EntityState.Modified && group.Id > 0)
                    {
                        ids.Add(group.Id);
                    }
                    continue;
                }
                if (_nonEditGroupEntities.Contains(entry.Entity.GetType().Name))
                {
                    continue;
                }
                var prop = entry.Metadata.FindProperty("GroupId");
                if (prop == null)
                {
                    continue;
                }
                if (entry.CurrentValues[prop] is int gid && gid > 0)
                {
                    ids.Add(gid);
                }
            }
            return ids.ToList();
        }
    }
}
