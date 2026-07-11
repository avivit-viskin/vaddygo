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
        private readonly ILogger<AuthService> _logger;

        public AuthService(AppDbContext db, IJwtTokenService jwt, IConfiguration config,
            ILogger<AuthService> logger)
        {
            _db = db;
            _jwt = jwt;
            _config = config;
            _logger = logger;
        }

        public async Task<AuthResult> RegisterAsync(RegisterDto dto)
        {
            var username = dto.Username.Trim();
            var email = dto.Email.Trim().ToLowerInvariant();

            if (await _db.Users.AnyAsync(u => u.Username == username))
            {
                return new AuthResult(null, "שם המשתמש כבר תפוס — נסי שם אחר");
            }
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
            var user = await _db.Users.FirstOrDefaultAsync(
                u => u.Username == identifier || u.Email == lower);

            // הודעה אחידה לשם משתמש/סיסמה שגויים — לא חושפים מה מהם שגוי
            if (user == null || !PasswordHasher.Verify(dto.Password, user.PasswordHash))
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

            // מאתרים לפי מזהה גוגל או לפי המייל (כדי לקשר חשבון קיים שנרשם עם מייל)
            var user = await _db.Users.FirstOrDefaultAsync(
                u => u.GoogleId == googleId || u.Email == email);

            if (user == null)
            {
                // משתמש חדש דרך Google — אין סיסמה; שם משתמש ייחודי נגזר מהמייל
                user = new User
                {
                    Username = await GenerateUniqueUsernameAsync(email),
                    Email = email,
                    GoogleId = googleId,
                    Role = "Member",
                    SubscriptionValidUntil = SubscriptionPolicy.ValidUntil(DateTime.UtcNow),
                };
                _db.Users.Add(user);
                await _db.SaveChangesAsync();
                _logger.LogInformation("User created via Google (Id: {UserId})", user.Id);
            }
            else if (string.IsNullOrEmpty(user.GoogleId))
            {
                // חשבון קיים (מייל+סיסמה) — מקשרים אליו את מזהה גוגל
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

        /* יוצר שם משתמש ייחודי מהחלק שלפני ה-@ במייל, עם מספר אם כבר תפוס */
        private async Task<string> GenerateUniqueUsernameAsync(string email)
        {
            var baseName = new string(email.Split('@')[0]
                .Where(c => char.IsLetterOrDigit(c)).ToArray());
            if (baseName.Length < 3) baseName = "user" + baseName;

            var candidate = baseName;
            var suffix = 1;
            while (await _db.Users.AnyAsync(u => u.Username == candidate))
            {
                candidate = $"{baseName}{suffix++}";
            }
            return candidate;
        }

        private AuthResponseDto BuildResponse(User user) => new()
        {
            Token = _jwt.CreateToken(user),
            Username = user.Username,
            Role = user.Role,
            SubscriptionValidUntil = user.SubscriptionValidUntil,
        };
    }
}
