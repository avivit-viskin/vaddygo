using System.Security.Cryptography;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.Auth;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      AuthService — הלוגיקה העסקית של הרשמה וכניסה:
      גיבוב סיסמה, בדיקת ייחודיות שם משתמש/מייל, חישוב תוקף המנוי,
      אימות בכניסה (שם משתמש/סיסמה או Google), והפקת JWT. אין כאן HTTP — רק BL.
    */
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _db;
        private readonly IJwtTokenService _jwt;
        private readonly IConfiguration _config;
        private readonly IAccessScope _access;
        private readonly IEmailSender _email;
        private readonly ILogger<AuthService> _logger;

        public AuthService(AppDbContext db, IJwtTokenService jwt, IConfiguration config,
            IAccessScope access, IEmailSender email, ILogger<AuthService> logger)
        {
            _db = db;
            _jwt = jwt;
            _config = config;
            _access = access;
            _email = email;
            _logger = logger;
        }

        public async Task<AuthResult> RegisterAsync(RegisterDto dto)
        {
            var username = dto.Username.Trim();
            var email = dto.Email.Trim().ToLowerInvariant();

            // הזהות היא המייל בלבד — שם משתמש כפול מותר (החלטת בעלת המוצר).
            if (await _db.Users.AnyAsync(u => u.Email == email))
            {
                return new AuthResult(null, "כתובת המייל כבר רשומה במערכת");
            }

            var user = new User
            {
                Username = username,
                Email = email,
                PasswordHash = PasswordHasher.Hash(dto.Password),
                Role = "Member",
                SubscriptionValidUntil = SubscriptionPolicy.ValidUntil(DateTime.UtcNow),
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            _logger.LogInformation("User registered (Id: {UserId})", user.Id);

            return new AuthResult(BuildResponse(user), null);
        }

        public async Task<AuthResult> LoginAsync(LoginDto dto)
        {
            var identifier = dto.UsernameOrEmail.Trim();
            var lower = identifier.ToLowerInvariant();
            // המייל ייחודי; שם המשתמש יכול לחזור על עצמו — לכן שולפים את כל המועמדים
            // ומאמתים סיסמה מול כל אחד, כדי לזהות נכון את המשתמש הנכון.
            var candidates = await _db.Users
                .Where(u => u.Username == identifier || u.Email == lower)
                .ToListAsync();
            var user = candidates.FirstOrDefault(
                u => PasswordHasher.Verify(dto.Password, u.PasswordHash));

            // הודעה אחידה לשם משתמש/סיסמה שגויים — לא חושפים מה מהם שגוי
            if (user == null)
            {
                return new AuthResult(null, "שם משתמש או סיסמה שגויים");
            }

            if (!SubscriptionPolicy.IsActive(user.SubscriptionValidUntil))
            {
                return new AuthResult(null, "תוקף המנוי פג. יש לחדש כדי להמשיך.");
            }

            _logger.LogInformation("User logged in (Id: {UserId})", user.Id);
            return new AuthResult(BuildResponse(user), null);
        }

        public async Task<AuthResult> LoginWithGoogleAsync(GoogleLoginDto dto)
        {
            GoogleJsonWebSignature.Payload payload;
            try
            {
                // מאמת את ה-ID token מול גוגל: חתימה, תוקף, ושה-audience הוא ה-Client ID שלנו
                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { GoogleSettings.GetClientId(_config) },
                };
                payload = await GoogleJsonWebSignature.ValidateAsync(dto.Credential, settings);
            }
            catch (InvalidJwtException)
            {
                return new AuthResult(null, "ההזדהות מול Google נכשלה. נסי שוב.");
            }

            var email = payload.Email.Trim().ToLowerInvariant();
            var googleId = payload.Subject;

            // מאתרים לפי מזהה גוגל או לפי המייל (לקשר חשבון קיים שנרשם עם אותו מייל)
            var user = await _db.Users.FirstOrDefaultAsync(
                u => u.GoogleId == googleId || u.Email == email);

            // כניסת Google היא רק למי שכבר יש לו חשבון (רכש והירשם) — לא יוצרים חשבון חדש
            if (user == null)
            {
                return new AuthResult(null,
                    "לא נמצא חשבון המקושר לכתובת ה-Google הזו. יש להירשם תחילה, או להתחבר עם שם משתמש וסיסמה.");
            }

            // חשבון קיים (מייל+סיסמה) שמתחבר לראשונה עם Google — מקשרים את מזהה גוגל
            if (string.IsNullOrEmpty(user.GoogleId))
            {
                user.GoogleId = googleId;
                await _db.SaveChangesAsync();
            }

            if (!SubscriptionPolicy.IsActive(user.SubscriptionValidUntil))
            {
                return new AuthResult(null, "תוקף המנוי פג. יש לחדש כדי להמשיך.");
            }

            _logger.LogInformation("User logged in via Google (Id: {UserId})", user.Id);
            return new AuthResult(BuildResponse(user), null);
        }

        public async Task<string?> ChangePasswordAsync(ChangePasswordDto dto)
        {
            var userId = _access.UserId;
            if (userId == null)
            {
                return "יש להתחבר כדי לשנות סיסמה";
            }
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null)
            {
                return "המשתמש לא נמצא";
            }
            if (!PasswordHasher.Verify(dto.CurrentPassword, user.PasswordHash))
            {
                return "הסיסמה הנוכחית שגויה";
            }

            user.PasswordHash = PasswordHasher.Hash(dto.NewPassword);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Password changed (User: {UserId})", user.Id);
            return null;
        }

        public async Task RequestPasswordResetAsync(ForgotPasswordDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

            // אבטחה: לא חושפים אם המייל קיים — תמיד מחזירים הצלחה כללית.
            // רק אם המשתמש קיים באמת מייצרים קוד ושולחים.
            if (user == null)
            {
                return;
            }

            // קוד בן 6 ספרות (קריפטוגרפי). נשמר מגובב בלבד; תקף ל-15 דקות.
            var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
            user.ResetCodeHash = PasswordHasher.Hash(code);
            user.ResetCodeExpiresAt = DateTime.UtcNow.AddMinutes(15);
            await _db.SaveChangesAsync();

            var body =
                "שלום 🙂\n\n" +
                $"הקוד שלך לאיפוס הסיסמה ב-VaddyGo הוא: {code}\n\n" +
                "הקוד תקף ל-15 דקות. אם לא ביקשת לאפס סיסמה — אפשר פשוט להתעלם מהמייל הזה.\n\n" +
                "בהצלחה,\nצוות VaddyGo 💜";
            try
            {
                await _email.SendAsync(user.Email, "קוד לאיפוס סיסמה — VaddyGo", body);
                _logger.LogInformation("Password reset code issued (User: {UserId})", user.Id);
            }
            catch (Exception ex)
            {
                // כשל שליחה לא נחשף למשתמש (עדיין מחזירים הצלחה כללית) — רק נרשם ללוג.
                _logger.LogError(ex, "Failed to send reset email (User: {UserId})", user.Id);
            }
        }

        public async Task<string?> ResetPasswordAsync(ResetPasswordDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

            // הודעה אחידה לכל כשל (קוד שגוי/פג/אין בקשה) — לא חושפים פרטים
            if (user == null
                || string.IsNullOrEmpty(user.ResetCodeHash)
                || user.ResetCodeExpiresAt == null
                || user.ResetCodeExpiresAt.Value < DateTime.UtcNow
                || !PasswordHasher.Verify(dto.Code.Trim(), user.ResetCodeHash))
            {
                return "הקוד שגוי או שפג תוקפו. אפשר לבקש קוד חדש.";
            }

            user.PasswordHash = PasswordHasher.Hash(dto.NewPassword);
            user.ResetCodeHash = null;      // קוד חד-פעמי — נמחק אחרי שימוש
            user.ResetCodeExpiresAt = null;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Password reset via code (User: {UserId})", user.Id);
            return null;
        }

        private AuthResponseDto BuildResponse(User user) => new()
        {
            Token = _jwt.CreateToken(user),
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            SubscriptionValidUntil = user.SubscriptionValidUntil,
        };
    }
}
