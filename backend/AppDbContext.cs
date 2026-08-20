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

        // צפיות בכרטיס הספק לפי יום — הבסיס להשוואת תקופות בדוח הספק
        public DbSet<VendorViewDay> VendorViewDays { get; set; }

        // כוונת רכישת פרו — מקשרת בין לחיצת התשלום ל-webhook של GROW (שורד אתחול)
        public DbSet<PendingProIntent> PendingProIntents { get; set; }

        // אימות דו-שלבי: אתגר פתוח, קודי גיבוי, ומכשירים שנזכרו
        public DbSet<TwoFactorChallenge> TwoFactorChallenges { get; set; }
        public DbSet<TwoFactorBackupCode> TwoFactorBackupCodes { get; set; }
        public DbSet<TrustedDevice> TrustedDevices { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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
    }
}
