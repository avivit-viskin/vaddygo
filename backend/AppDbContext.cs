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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // שם משתמש ומייל ייחודיים — הגנה ברמת המסד, לא רק בבדיקה בקוד
            modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        }
    }
}
