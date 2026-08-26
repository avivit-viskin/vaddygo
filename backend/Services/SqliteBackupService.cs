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
        private readonly IEmailSender _email;
        private readonly ILogger<SqliteBackupService> _logger;

        public SqliteBackupService(
            AppDbContext db,
            IConfiguration config,
            IEmailSender email,
            ILogger<SqliteBackupService> logger)
        {
            _db = db;
            _config = config;
            _email = email;
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

            // עותק מחוץ לשרת — שולח את הגיבוי במייל (גיבוי בתוך השרת מגן מפני
            // תקלות רגילות, אך לא מפני אובדן מוחלט של ה-Volume). לא מפיל את הגיבוי
            // אם השליחה נכשלת.
            await MaybeSendOffsiteAsync(directory, target, cancellationToken);

            return target;
        }

        /*
          שולח את קובץ הגיבוי (דחוס ב-gzip) למייל היעד, לכל היותר פעם ב-
          Backup:EmailIntervalHours (ברירת מחדל 168 = שבועי). כדי לא לשלוח בכל
          אתחול שרת, שומרים קובץ-סימון בתיקיית הגיבויים (על ה-Volume) עם זמן
          השליחה האחרונה. יעד ברירת המחדל: Backup:EmailTo, ואם ריק — כתובת
          המנהלת (Admin:SuperAdminEmail).
        */
        private async Task MaybeSendOffsiteAsync(
            string directory, string backupPath, CancellationToken ct)
        {
            var emailTo = _config["Backup:EmailTo"];
            if (string.IsNullOrWhiteSpace(emailTo))
            {
                emailTo = _config["Admin:SuperAdminEmail"];
            }
            if (string.IsNullOrWhiteSpace(emailTo))
            {
                return; // אין יעד — הגיבוי החוצה כבוי
            }

            var intervalHours = Math.Max(1, _config.GetValue("Backup:EmailIntervalHours", 168));
            var marker = Path.Combine(directory, ".last-offsite-email");
            if (File.Exists(marker) &&
                DateTime.UtcNow - File.GetLastWriteTimeUtc(marker) < TimeSpan.FromHours(intervalHours))
            {
                return; // נשלח לאחרונה בתוך החלון — עדיין לא הזמן
            }

            try
            {
                var gz = GzipFile(backupPath);

                // הגנת גודל — מייל עם צירוף גדול מדי יידחה; עדיף לדלג ולרשום.
                var maxMb = Math.Max(1, _config.GetValue("Backup:EmailMaxMb", 20));
                if (gz.Length > (long)maxMb * 1024 * 1024)
                {
                    _logger.LogWarning(
                        "Off-site backup skipped — compressed size {Size}MB exceeds cap {Cap}MB",
                        gz.Length / (1024 * 1024), maxMb);
                    return;
                }

                var fileName = Path.GetFileNameWithoutExtension(backupPath) + ".db.gz";
                var subject = "גיבוי אוטומטי — VaddyGo";
                var body =
                    "מצורף גיבוי אוטומטי של הנתונים שלך ב-VaddyGo.\n\n" +
                    "כדאי לשמור את המייל הזה — זהו עותק מחוץ לשרת, למקרה חירום.\n" +
                    "אם אי פעם תצטרכי לשחזר ממנו, שמרי את הקובץ ופני אלינו ונעזור.\n\n" +
                    "הקובץ דחוס (gz). אין צורך לפתוח אותו — רק לשמור.";

                await _email.SendWithAttachmentAsync(emailTo, subject, body, fileName, gz);

                // עדכון קובץ-הסימון רק אחרי שליחה מוצלחת (אחרת ננסה שוב בגיבוי הבא).
                await File.WriteAllTextAsync(marker, DateTime.UtcNow.ToString("o"), ct);
                _logger.LogInformation("Off-site backup emailed ({File}, {Size}KB)",
                    fileName, gz.Length / 1024);
            }
            catch (Exception ex)
            {
                // כישלון בשליחה החוצה אסור שיפיל את הגיבוי המקומי (שכבר נשמר).
                _logger.LogError(ex, "Off-site backup email failed");
            }
        }

        /* קורא קובץ ומחזיר אותו דחוס ב-gzip (זיכרון — קובצי המסד קטנים). */
        private static byte[] GzipFile(string path)
        {
            var raw = File.ReadAllBytes(path);
            using var output = new MemoryStream();
            using (var gzip = new System.IO.Compression.GZipStream(
                output, System.IO.Compression.CompressionLevel.Optimal))
            {
                gzip.Write(raw, 0, raw.Length);
            }
            return output.ToArray();
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
