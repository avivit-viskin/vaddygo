namespace ParentCommitteeAPI.Services
{
    /*
      FileEmailSender — כותב מיילים יוצאים לקבצים במקום לשלוח אותם.

      למה זה קיים: זרימות שמסתמכות על קוד שנשלח במייל (איפוס סיסמה, אימות
      דו-שלבי) אי אפשר לבדוק מקצה-לקצה בלי לקרוא את המייל — הקוד נשמר מגובב
      ואינו ניתן לשחזור מהמסד. בלי הכלי הזה, הבדיקה היחידה האפשרית היא
      "השרת לא קרס", וזה בדיוק סוג האימות שמפספס באגים אמיתיים.

      🔒 **נרשם ב-Program.cs רק בסביבת Development.** אינו יכול להיבחר בייצור
      גם בטעות של משתנה סביבה, ולכן אינו מסלול עוקף לקריאת מיילים של אחרים.
    */
    public class FileEmailSender : IEmailSender
    {
        private readonly string _directory;
        private readonly ILogger<FileEmailSender> _logger;

        public FileEmailSender(IConfiguration config, ILogger<FileEmailSender> logger)
        {
            _directory = config["Email:Directory"]
                ?? Path.Combine(Path.GetTempPath(), "vaddygo-mail");
            _logger = logger;
        }

        public async Task SendAsync(string toEmail, string subject, string body)
        {
            Directory.CreateDirectory(_directory);
            // שם קובץ יציב לכל נמען — הבדיקה קוראת תמיד את המייל האחרון אליו.
            var safe = string.Concat(toEmail.Select(c => char.IsLetterOrDigit(c) ? c : '_'));
            var path = Path.Combine(_directory, $"{safe}.txt");
            await File.WriteAllTextAsync(path, $"{subject}\n\n{body}");
            _logger.LogInformation("Email written to {Path} (development sink)", path);
        }
    }
}
