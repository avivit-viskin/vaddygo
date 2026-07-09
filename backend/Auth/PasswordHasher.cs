using System.Security.Cryptography;

namespace ParentCommitteeAPI.Auth
{
    /*
      PasswordHasher — גיבוב סיסמאות עם PBKDF2 (מובנה ב-.NET, בלי חבילה חיצונית).
      מאחסנים: iterations.salt.hash (Base64). לעולם לא שומרים את הסיסמה עצמה.
    */
    public static class PasswordHasher
    {
        private const int SaltSize = 16;      // 128 ביט
        private const int KeySize = 32;       // 256 ביט
        private const int Iterations = 100_000;
        private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

        public static string Hash(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algorithm, KeySize);
            return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
        }

        public static bool Verify(string password, string stored)
        {
            var parts = stored.Split('.', 3);
            if (parts.Length != 3 || !int.TryParse(parts[0], out var iterations))
            {
                return false;
            }

            var salt = Convert.FromBase64String(parts[1]);
            var expected = Convert.FromBase64String(parts[2]);
            var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, Algorithm, expected.Length);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
    }
}
