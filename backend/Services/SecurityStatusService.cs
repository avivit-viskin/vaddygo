using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.Auth;
using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      ISecurityStatusService — מדווח אילו הגנות פעילות בפועל בסביבה הרצה.

      למה זה נחוץ: כל ההגנות האלה מופעלות דרך משתני סביבה, והמערכת עובדת
      בדיוק אותו דבר כשהן כבויות. בלי חיווי, "הגדרתי את המשתנה" ו"ההגנה
      פועלת" הם שני דברים שונים שאי אפשר להבחין ביניהם.

      מחזיר דגלים בלבד — אף פעם לא את הערכים עצמם.
    */
    public interface ISecurityStatusService
    {
        Task<SecurityStatusDto> GetAsync();
    }

    public class SecurityStatusService : ISecurityStatusService
    {
        private readonly IConfiguration _config;
        private readonly AppDbContext _db;
        private readonly IEncryptionBackfillService _backfill;

        public SecurityStatusService(
            IConfiguration config, AppDbContext db, IEncryptionBackfillService backfill)
        {
            _config = config;
            _db = db;
            _backfill = backfill;
        }

        public async Task<SecurityStatusDto> GetAsync()
        {
            var jwtKey = _config["Jwt:Key"];
            var provider = _config["Payments:Provider"] ?? "mock";
            var origins = _config.GetSection("Cors:AllowedOrigins").Get<string[]>()
                          ?? new[] { "http://localhost:3000" };

            return new SecurityStatusDto
            {
                EncryptionAtRest = FieldEncryption.IsEnabled,
                StrongJwtKey = !string.IsNullOrWhiteSpace(jwtKey)
                               && jwtKey != JwtSettings.DevKey,
                RealPaymentProvider =
                    !string.Equals(provider, "mock", StringComparison.OrdinalIgnoreCase),
                BackupsEnabled = _config.GetValue("Backup:Enabled", true),
                ProductionCors = origins.Any(
                    o => !o.Contains("localhost", StringComparison.OrdinalIgnoreCase)),
                LastBackupAt = FindLastBackup(),
                PendingEncryption = await _backfill.CountPendingAsync(),
            };
        }

        /*
          מתי נוצר הגיבוי האחרון. נקרא מהתיקייה עצמה ולא מזיכרון, כדי שהחיווי
          ישקף את המצב האמיתי על הדיסק — כולל אחרי פריסה מחדש.
        */
        private DateTime? FindLastBackup()
        {
            try
            {
                if (!_db.Database.IsSqlite())
                {
                    return null;
                }
                var connectionString = _db.Database.GetConnectionString();
                if (string.IsNullOrWhiteSpace(connectionString))
                {
                    return null;
                }
                var dataSource = new SqliteConnectionStringBuilder(connectionString).DataSource;
                var configured = _config["Backup:Directory"];
                var directory = string.IsNullOrWhiteSpace(configured)
                    ? Path.Combine(
                        Path.GetDirectoryName(Path.GetFullPath(dataSource)) ?? ".", "backups")
                    : configured;

                if (!Directory.Exists(directory))
                {
                    return null;
                }
                var latest = Directory.GetFiles(directory, "vaadygo-*.db")
                    .Select(File.GetLastWriteTimeUtc)
                    .DefaultIfEmpty()
                    .Max();
                return latest == default ? null : latest;
            }
            catch
            {
                // חיווי בלבד — לא מפילים את המסך בגלל בעיית קריאה בתיקייה
                return null;
            }
        }
    }
}
