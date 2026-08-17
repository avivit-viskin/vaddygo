using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.Auth;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      TwoFactorService — השלב השני בהתחברות: קוד חד-פעמי אחרי הסיסמה.

      מה זה מגן עליו שהצפנה לא מגינה: ההצפנה במנוחה שומרת על **הקובץ** מפני מי
      שמשיג עותק שלו. מי שיודע את הסיסמה נכנס דרך הדלת הקדמית ורואה הכול
      מפוענח. עבור חשבון המנהלת — שרואה את כל הגנים, כל הילדים וכל האלרגיות —
      הסיסמה הייתה נקודת הכשל היחידה שנשארה.

      שלוש החלטות שמעצבות את הקובץ הזה:

      1. **קודי גיבוי הם חלק מהתכונה, לא תוספת.** התכונה מוסיפה תלות בגורם
         חיצוני שיכול להישבר; בלי מסלול חילוץ, תקלה במייל נועלת את בעלת המערכת
         מחוץ למערכת שלה לצמיתות. לכן ההפעלה מנפיקה קודים באותה פעולה.

      2. **ערוץ חלופי בזמן אמת.** בקשת בעלת המוצר: מי שאין לו גישה לתיבה באותו
         רגע יוכל לבקש את הקוד ב-SMS מבלי להתחיל מחדש. לכן ResendAsync מקבל
         ערוץ, ולכן הערוצים מופשטים (ITwoFactorChannel).

      3. **פעולות הרסניות דורשות סיסמה שוב.** כיבוי האימות, החלפת קודי גיבוי
         וניתוק מכשירים — כולם דורשים סיסמה גם ממשתמש מחובר, אחרת מסך שנשאר
         פתוח לרגע מספיק כדי לפרק את ההגנה.
    */
    public class TwoFactorService : ITwoFactorService
    {
        private readonly AppDbContext _db;
        private readonly IEnumerable<ITwoFactorChannel> _channels;
        private readonly ISmsSender _sms;
        private readonly ILogger<TwoFactorService> _logger;

        /* הקוד תקף ל-10 דקות — מספיק כדי לפתוח מייל בטלפון, קצר מספיק כדי שלא יישכח פתוח. */
        private static readonly TimeSpan CodeLifetime = TimeSpan.FromMinutes(10);

        /* מכשיר זכור פטור מהקוד לחודש. אחר כך נדרש אימות מחדש. */
        private static readonly TimeSpan DeviceLifetime = TimeSpan.FromDays(30);

        /* 5 ניסיונות שגויים סוגרים את האתגר — קוד בן 6 ספרות אחרת ניתן לניחוש. */
        private const int MaxAttempts = 5;

        private const int BackupCodeCount = 10;

        public TwoFactorService(
            AppDbContext db,
            IEnumerable<ITwoFactorChannel> channels,
            ISmsSender sms,
            ILogger<TwoFactorService> logger)
        {
            _db = db;
            _channels = channels;
            _sms = sms;
            _logger = logger;
        }

        // ───────────────────────── התחברות ─────────────────────────

        public async Task<bool> IsRequiredAsync(User user, string? deviceToken)
        {
            if (!user.TwoFactorEnabled)
            {
                return false;
            }
            return !await IsTrustedDeviceAsync(user.Id, deviceToken);
        }

        public async Task<TwoFactorRequiredDto> StartChallengeAsync(User user, string? channelKey = null)
        {
            var channel = ResolveChannel(user, channelKey);

            // קוד בן 6 ספרות, קריפטוגרפי. נשמר מגובב בלבד — כמו קוד איפוס סיסמה.
            var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
            var challengeId = SecureToken.Create();

            // ניסיון התחברות חדש מבטל אתגרים קודמים של אותו משתמש, כדי שקוד ישן
            // שנשלח למייל לא יישאר תקף אחרי שביקשו קוד חדש.
            await ClearChallengesAsync(user.Id);

            _db.TwoFactorChallenges.Add(new TwoFactorChallenge
            {
                UserId = user.Id,
                ChallengeFingerprint = SecureToken.Fingerprint(challengeId),
                CodeHash = PasswordHasher.Hash(code),
                Channel = channel.Key,
                ExpiresAt = DateTime.UtcNow.Add(CodeLifetime),
            });
            await _db.SaveChangesAsync();

            await SendCodeAsync(channel, user, code);

            return new TwoFactorRequiredDto
            {
                ChallengeId = challengeId,
                Channel = channel.Key,
                SentTo = channel.Describe(user),
                Channels = AvailableChannels(user),
            };
        }

        public async Task<TwoFactorVerifyResult> VerifyAsync(TwoFactorVerifyDto dto)
        {
            const string genericError = "הקוד שגוי או שפג תוקפו. אפשר לבקש קוד חדש.";

            var challenge = await FindChallengeAsync(dto.ChallengeId);
            if (challenge == null)
            {
                return new TwoFactorVerifyResult(null, null, genericError);
            }

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == challenge.UserId);
            if (user == null)
            {
                return new TwoFactorVerifyResult(null, null, genericError);
            }

            var entered = dto.Code.Trim();

            // קוד גיבוי מתקבל באותו שדה: מי שנתקע לא צריך לחפש מסך אחר. מזוהה
            // לפי הצורה (XXXX-XXXX) ולא לפי בחירה של המשתמש.
            var isBackup = entered.Contains('-');
            var ok = isBackup
                ? await ConsumeBackupCodeAsync(user.Id, entered)
                : PasswordHasher.Verify(entered, challenge.CodeHash);

            if (!ok)
            {
                challenge.Attempts += 1;
                if (challenge.Attempts >= MaxAttempts)
                {
                    _db.TwoFactorChallenges.Remove(challenge);
                    _logger.LogWarning(
                        "2FA challenge closed after too many attempts (User: {UserId})", user.Id);
                }
                await _db.SaveChangesAsync();
                return new TwoFactorVerifyResult(null, null, genericError);
            }

            // הקוד חד-פעמי: האתגר נמחק בין אם נוצל קוד שנשלח ובין אם קוד גיבוי.
            _db.TwoFactorChallenges.Remove(challenge);

            string? deviceToken = null;
            if (dto.RememberDevice)
            {
                deviceToken = await RememberDeviceAsync(user.Id);
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "2FA verified (User: {UserId}, backup: {IsBackup})", user.Id, isBackup);

            return new TwoFactorVerifyResult(user, deviceToken, null);
        }

        public async Task<TwoFactorRequiredDto?> ResendAsync(TwoFactorResendDto dto)
        {
            var challenge = await FindChallengeAsync(dto.ChallengeId);
            if (challenge == null)
            {
                return null;
            }
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == challenge.UserId);
            if (user == null)
            {
                return null;
            }

            // שליחה חוזרת מייצרת אתגר חדש לגמרי (ומזהה חדש), כדי שקוד ישן לא
            // יישאר תקף במקביל לחדש.
            return await StartChallengeAsync(user, dto.Channel);
        }

        // ───────────────────────── הגדרות ─────────────────────────

        public async Task<TwoFactorStatusDto> GetStatusAsync(int userId)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return new TwoFactorStatusDto();
            }

            var remaining = await _db.TwoFactorBackupCodes
                .CountAsync(c => c.UserId == userId && c.UsedAt == null);
            var devices = await _db.TrustedDevices
                .CountAsync(d => d.UserId == userId && d.ExpiresAt > DateTime.UtcNow);

            return new TwoFactorStatusDto
            {
                Enabled = user.TwoFactorEnabled,
                Channel = user.TwoFactorChannel,
                Phone = string.IsNullOrWhiteSpace(user.TwoFactorPhone)
                    ? null
                    : Channel(TwoFactorChannels.Sms)?.Describe(user),
                SmsAvailable = _sms.IsConfigured,
                BackupCodesRemaining = remaining,
                TrustedDevices = devices,
            };
        }

        public async Task<(TwoFactorRequiredDto? Challenge, string? Error)> StartSetupAsync(
            int userId, TwoFactorSetupDto dto)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return (null, "המשתמש לא נמצא");
            }

            /*
              בלי סיסמה מוגדרת אין דרך לכבות את האימות אחר כך — כיבוי והנפקת
              קודים דורשים אימות סיסמה, וחשבון בלי סיסמה היה נשאר נעול על
              ההגדרה לצמיתות. עדיף לחסום את ההפעלה מאשר לתקן אחריה.
              (המודל מאפשר חשבון כזה; זרימת ההרשמה הנוכחית תמיד קובעת סיסמה.)
            */
            if (string.IsNullOrEmpty(user.PasswordHash))
            {
                return (null, "יש לקבוע סיסמה לחשבון לפני הפעלת האימות הדו-שלבי");
            }

            var key = (dto.Channel ?? string.Empty).Trim().ToLowerInvariant();
            if (key != TwoFactorChannels.Email && key != TwoFactorChannels.Sms)
            {
                return (null, "יש לבחור דרך לקבלת הקוד");
            }

            if (key == TwoFactorChannels.Sms)
            {
                if (!_sms.IsConfigured)
                {
                    return (null, "שליחת קוד ב-SMS אינה זמינה כרגע. אפשר לקבל את הקוד במייל.");
                }
                var phone = NormalizePhone(dto.Phone);
                if (phone == null)
                {
                    return (null, "יש להזין מספר טלפון נייד תקין");
                }
                // נשמר מוצפן כמו כל טלפון אחר במערכת. בשלב זה הוא עדיין לא
                // "מאומת" — האימות הוא עצם קבלת הקוד בשלב הבא.
                user.TwoFactorPhone = FieldEncryption.Protect(phone);
            }

            user.TwoFactorChannel = key;
            await _db.SaveChangesAsync();

            var challenge = await StartChallengeAsync(user, key);
            return (challenge, null);
        }

        public async Task<(List<string>? Codes, string? Error)> EnableAsync(
            int userId, TwoFactorEnableDto dto)
        {
            var challenge = await FindChallengeAsync(dto.ChallengeId);
            if (challenge == null || challenge.UserId != userId)
            {
                return (null, "הקוד שגוי או שפג תוקפו. אפשר לבקש קוד חדש.");
            }

            if (!PasswordHasher.Verify(dto.Code.Trim(), challenge.CodeHash))
            {
                challenge.Attempts += 1;
                if (challenge.Attempts >= MaxAttempts)
                {
                    _db.TwoFactorChallenges.Remove(challenge);
                }
                await _db.SaveChangesAsync();
                return (null, "הקוד שגוי או שפג תוקפו. אפשר לבקש קוד חדש.");
            }

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return (null, "המשתמש לא נמצא");
            }

            user.TwoFactorEnabled = true;
            _db.TwoFactorChallenges.Remove(challenge);

            // ההפעלה והנפקת קודי הגיבוי הן פעולה אחת — אין רגע שבו האימות דלוק
            // ואין מסלול חילוץ.
            var codes = await IssueBackupCodesAsync(userId);

            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "2FA enabled (User: {UserId}, channel: {Channel})", userId, user.TwoFactorChannel);
            return (codes, null);
        }

        public async Task<string?> DisableAsync(int userId, string password)
        {
            var user = await RequirePasswordAsync(userId, password);
            if (user == null)
            {
                return "הסיסמה שגויה";
            }

            user.TwoFactorEnabled = false;
            user.TwoFactorPhone = null;
            user.TwoFactorChannel = TwoFactorChannels.Email;

            // כיבוי מנקה גם את מה שנלווה אליו: קודי גיבוי שאין להם משמעות,
            // מכשירים זכורים שאין ממה לפטור אותם, ואתגרים פתוחים.
            await ClearBackupCodesAsync(userId);
            await ClearDevicesAsync(userId);
            await ClearChallengesAsync(userId);

            await _db.SaveChangesAsync();
            _logger.LogInformation("2FA disabled (User: {UserId})", userId);
            return null;
        }

        public async Task<(List<string>? Codes, string? Error)> RegenerateBackupCodesAsync(
            int userId, string password)
        {
            var user = await RequirePasswordAsync(userId, password);
            if (user == null)
            {
                return (null, "הסיסמה שגויה");
            }
            if (!user.TwoFactorEnabled)
            {
                return (null, "האימות הדו-שלבי אינו פעיל");
            }

            var codes = await IssueBackupCodesAsync(userId);
            await _db.SaveChangesAsync();
            _logger.LogInformation("2FA backup codes regenerated (User: {UserId})", userId);
            return (codes, null);
        }

        public async Task<string?> ForgetDevicesAsync(int userId, string password)
        {
            var user = await RequirePasswordAsync(userId, password);
            if (user == null)
            {
                return "הסיסמה שגויה";
            }

            await ClearDevicesAsync(userId);
            await _db.SaveChangesAsync();
            _logger.LogInformation("2FA trusted devices cleared (User: {UserId})", userId);
            return null;
        }

        // ───────────────────────── עזר ─────────────────────────

        private ITwoFactorChannel? Channel(string key) =>
            _channels.FirstOrDefault(c => c.Key == key);

        /*
          בוחר ערוץ בשלושה שלבים: המבוקש (אם זמין), המועדף של המשתמש, ולבסוף
          המייל. הנפילה למייל היא הכרחית — משתמש שהגדיר SMS ואז הספק הפסיק
          לעבוד חייב עדיין להיכנס לחשבון שלו.
        */
        private ITwoFactorChannel ResolveChannel(User user, string? requested)
        {
            var wanted = (requested ?? string.Empty).Trim().ToLowerInvariant();
            var byRequest = Channel(wanted);
            if (byRequest != null && byRequest.IsAvailableFor(user))
            {
                return byRequest;
            }

            var preferred = Channel(user.TwoFactorChannel);
            if (preferred != null && preferred.IsAvailableFor(user))
            {
                return preferred;
            }

            return Channel(TwoFactorChannels.Email)
                   ?? throw new InvalidOperationException("לא מוגדר ערוץ מייל לאימות דו-שלבי.");
        }

        private List<TwoFactorChannelDto> AvailableChannels(User user) =>
            _channels
                .Where(c => c.IsAvailableFor(user))
                .Select(c => new TwoFactorChannelDto
                {
                    Key = c.Key,
                    Label = c.Key == TwoFactorChannels.Sms ? "מסרון" : "מייל",
                    Target = c.Describe(user),
                })
                .ToList();

        /*
          כשל בשליחה אינו מפיל את הבקשה: האתגר כבר נשמר, והמשתמש יכול לבקש
          שליחה חוזרת או לעבור לערוץ אחר. חריגה כאן הייתה מחזירה 500 ומשאירה
          אותו בלי שום מסלול.
        */
        private async Task SendCodeAsync(ITwoFactorChannel channel, User user, string code)
        {
            try
            {
                await channel.SendCodeAsync(user, code);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to send 2FA code (User: {UserId}, channel: {Channel})",
                    user.Id, channel.Key);
            }
        }

        private async Task<TwoFactorChallenge?> FindChallengeAsync(string? challengeId)
        {
            if (string.IsNullOrWhiteSpace(challengeId))
            {
                return null;
            }
            var fingerprint = SecureToken.Fingerprint(challengeId);
            var challenge = await _db.TwoFactorChallenges
                .FirstOrDefaultAsync(c => c.ChallengeFingerprint == fingerprint);

            if (challenge == null)
            {
                return null;
            }
            if (challenge.ExpiresAt < DateTime.UtcNow)
            {
                _db.TwoFactorChallenges.Remove(challenge);
                await _db.SaveChangesAsync();
                return null;
            }
            return challenge;
        }

        private async Task<bool> IsTrustedDeviceAsync(int userId, string? deviceToken)
        {
            if (string.IsNullOrWhiteSpace(deviceToken))
            {
                return false;
            }
            var fingerprint = SecureToken.Fingerprint(deviceToken);
            var device = await _db.TrustedDevices.FirstOrDefaultAsync(
                d => d.UserId == userId && d.TokenFingerprint == fingerprint);

            if (device == null)
            {
                return false;
            }
            if (device.ExpiresAt < DateTime.UtcNow)
            {
                _db.TrustedDevices.Remove(device);
                await _db.SaveChangesAsync();
                return false;
            }

            device.LastUsedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        private async Task<string> RememberDeviceAsync(int userId)
        {
            var token = SecureToken.Create();
            _db.TrustedDevices.Add(new TrustedDevice
            {
                UserId = userId,
                TokenFingerprint = SecureToken.Fingerprint(token),
                ExpiresAt = DateTime.UtcNow.Add(DeviceLifetime),
            });
            // השמירה נעשית אצל הקורא, יחד עם מחיקת האתגר.
            await Task.CompletedTask;
            return token;
        }

        /*
          מנפיק סט חדש ומבטל את הקודם. אין "הוספת קודים" — סט חלקי מבלבל, ואי
          אפשר לדעת אילו קודים המשתמש עדיין מחזיק.
        */
        private async Task<List<string>> IssueBackupCodesAsync(int userId)
        {
            await ClearBackupCodesAsync(userId);

            var codes = new List<string>();
            for (var i = 0; i < BackupCodeCount; i++)
            {
                var code = SecureToken.CreateBackupCode();
                codes.Add(code);
                _db.TwoFactorBackupCodes.Add(new TwoFactorBackupCode
                {
                    UserId = userId,
                    CodeFingerprint = SecureToken.FingerprintCode(code),
                });
            }
            return codes;
        }

        private async Task<bool> ConsumeBackupCodeAsync(int userId, string entered)
        {
            var fingerprint = SecureToken.FingerprintCode(entered);
            var code = await _db.TwoFactorBackupCodes.FirstOrDefaultAsync(
                c => c.UserId == userId && c.CodeFingerprint == fingerprint && c.UsedAt == null);

            if (code == null)
            {
                return false;
            }
            code.UsedAt = DateTime.UtcNow;
            _logger.LogWarning("2FA backup code used (User: {UserId})", userId);
            return true;
        }

        private async Task<User?> RequirePasswordAsync(int userId, string password)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || !PasswordHasher.Verify(password ?? string.Empty, user.PasswordHash))
            {
                return null;
            }
            return user;
        }

        private async Task ClearChallengesAsync(int userId)
        {
            var open = await _db.TwoFactorChallenges.Where(c => c.UserId == userId).ToListAsync();
            _db.TwoFactorChallenges.RemoveRange(open);
        }

        private async Task ClearBackupCodesAsync(int userId)
        {
            var existing = await _db.TwoFactorBackupCodes.Where(c => c.UserId == userId).ToListAsync();
            _db.TwoFactorBackupCodes.RemoveRange(existing);
        }

        private async Task ClearDevicesAsync(int userId)
        {
            var devices = await _db.TrustedDevices.Where(d => d.UserId == userId).ToListAsync();
            _db.TrustedDevices.RemoveRange(devices);
        }

        /*
          מנרמל למספר בפורמט בינלאומי, כי ספקי SMS דורשים אותו. מקבל 05X-XXXXXXX
          הישראלי ומוסיף +972; מספר שכבר מתחיל ב-+ נשאר כפי שהוא.
        */
        private static string? NormalizePhone(string? phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
            {
                return null;
            }
            var trimmed = phone.Trim();
            var digits = new string(trimmed.Where(char.IsDigit).ToArray());

            if (trimmed.StartsWith('+'))
            {
                return digits.Length >= 9 ? $"+{digits}" : null;
            }
            if (digits.StartsWith("972") && digits.Length >= 11)
            {
                return $"+{digits}";
            }
            // נייד ישראלי: 10 ספרות שמתחילות ב-05
            if (digits.Length == 10 && digits.StartsWith("05"))
            {
                return $"+972{digits[1..]}";
            }
            return null;
        }
    }
}
