using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      JwtTokenService — מפיק את ה-JWT החתום שהלקוח שולח בכל בקשה.
      המפתח (Jwt:Key) חייב להגיע ממשתני סביבה בייצור (Railway) — לא מהקוד.
    */
    public class JwtTokenService : IJwtTokenService
    {
        private readonly IConfiguration _config;

        public JwtTokenService(IConfiguration config)
        {
            _config = config;
        }

        public string CreateToken(User user)
        {
            var key = JwtSettings.GetKey(_config);
            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim("username", user.Username),
                new Claim(ClaimTypes.Role, user.Role),
            };

            var token = new JwtSecurityToken(
                issuer: JwtSettings.Issuer,
                audience: JwtSettings.Audience,
                claims: claims,
                // התוקף לא עובר את תוקף המנוי — כשהמנוי פג, גם ה-token כבר לא תקף
                expires: user.SubscriptionValidUntil,
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    /* הגדרות JWT משותפות לשירות ההפקה ולאימות ב-Program.cs — מקור אמת אחד */
    public static class JwtSettings
    {
        public const string Issuer = "VaadyGo";
        public const string Audience = "VaadyGoClient";

        public static string GetKey(IConfiguration config)
        {
            // בייצור המפתח מגיע מ-Jwt__Key (משתנה סביבה ב-Railway).
            // בפיתוח בלבד יש ברירת מחדל כדי שהשרת ירוץ מהקופסה
            // (מחרוזת ריקה ב-appsettings נחשבת כ"לא הוגדר").
            var key = config["Jwt:Key"];
            return string.IsNullOrWhiteSpace(key)
                ? "vaadygo-dev-only-signing-key-change-in-production-please-32b"
                : key;
        }
    }
}
