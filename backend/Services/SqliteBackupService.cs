using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace ParentCommitteeAPI.Services
{
    /*
      SqliteBackupService — גיבוי אוטומטי של קובץ המסד.

      השיטה: `VACUUM INTO` — הפקודה הרשמית של SQLite ליצירת עותק **עקבי** של
      מסד חי, בלי לעצור את השרת ובלי הסיכון של העתקת קובץ "מתחת לידיים" (שבמצב
      WAL עלולה לתפוס מסד באמצע כתיבה). הגיבוי נשמר לצד המסד בתיקיית `backups`
      (ב-Railway זה בתוך ה-Volume ב-/data — כלומר שורד פריסות מחדש).

      שמירה: נשמרים N הגיבויים האחרונים (ברירת מחדל 7) והישנים נמחקים, כדי
      שהדיסק לא יתמלא.

      הגדרות (appsettings / משתני סביבה):
        Backup:Enabled          — true/false (ברירת מחדל: true)
        Backup:Directory        — תיקיית יעד (ברירת מחדל: תיקיית `backups` ליד המסד)
        Backup:KeepCount        — כמה גיבויים לשמור (ברירת מחדל: 7)
    */
    public class SqliteBackupService : IDatabaseBackupService
    {
        private const int DefaultKeepCount = 7;

        private readonly AppDbContext _db;
        private readonly IConfiguration _config;
        private readonly ILogger<SqliteBackupService> _logger;

        public SqliteBackupService(
            AppDbContext db,
            IConfiguration config,
            ILogger<SqliteBackupService> logger)
        {
            _db = db;
            _config = config;
            _logger = logger;
        }

        public async Task<string?> RunAsync(CancellationToken cancellationToken = default)
        {
            if (!_config.GetValue("Backup:Enabled", true))
            {
                return null;
            }

            // גיבוי בשיטה הזו תקף ל-SQLite בלבד. במעבר עתידי ל-PostgreSQL
            // הגיבוי יגיע מהפלטפורמה (snapshot מנוהל) ולא מכאן.
            var sourcePath = GetSqliteFilePath();
            if (sourcePath == null)
            {
                _logger.LogInformation("Backup skipped — database is not SQLite");
                return null;
            }

            var directory = _config["Backup:Directory"];
            if (string.IsNullOrWhiteSpace(directory))
            {
                var dbFolder = Path.GetDirectoryName(Path.GetFullPath(sourcePath));
                directory = Path.Combine(dbFolder ?? ".", "backups");
            }
            Directory.CreateDirectory(directory);

            // חותמת זמן ב-UTC בשם הקובץ — ממיינת לקסיקוגרפית לפי סדר כרונולוגי
            var stamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");
            var target = Path.Combine(directory, $"vaadygo-{stamp}.db");

            // VACUUM INTO אינו מקבל פרמטרים, ולכן הנתיב נבנה על ידי השרת בלבד
            // (מהגדרות + חותמת זמן) — אף פעם לא מקלט משתמש. המרכאות מוכפלות
            // כדי שנתיב עם גרש לא ישבור את הפקודה.
            var quoted = target.Replace("'", "''");
            await _db.Database.ExecuteSqlRawAsync($"VACUUM INTO '{quoted}'", cancellationToken);

            var kept = Prune(directory);
            _logger.LogInformation(
                "Database backup created ({File}); {Kept} backups kept",
                Path.GetFileName(target), kept);
            return target;
        }

        /* מוחק גיבויים ישנים ומשאיר את KeepCount האחרונים. מחזיר כמה נשמרו. */
        private int Prune(string directory)
        {
            var keep = Math.Max(1, _config.GetValue("Backup:KeepCount", DefaultKeepCount));
            var files = Directory.GetFiles(directory, "vaadygo-*.db")
                .OrderByDescending(f => f)
                .ToList();

            foreach (var old in files.Skip(keep))
            {
                try
                {
                    File.Delete(old);
                }
                catch (Exception ex)
                {
                    // כשל במחיקה אינו סיבה להיכשל בגיבוי עצמו
                    _logger.LogWarning(ex, "Could not delete old backup {File}",
                        Path.GetFileName(old));
                }
            }

            return Math.Min(files.Count, keep);
        }

        /* נתיב קובץ ה-SQLite מתוך ה-connection string; null אם הספק אינו SQLite. */
        private string? GetSqliteFilePath()
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
            // מסד בזיכרון (בדיקות) — אין מה לגבות
            if (string.IsNullOrWhiteSpace(dataSource) ||
                dataSource.Contains(":memory:", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }
            return dataSource;
        }
    }
}
