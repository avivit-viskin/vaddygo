using ParentCommitteeAPI.Auth;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      ITwoFactorChannel — דרך אחת להעביר קוד חד-פעמי למשתמש.

      למה הפשטה ולא פשוט "שלח מייל": בעלת המוצר ביקשה שאפשר יהיה לקבל את הקוד
      **גם במייל וגם ב-SMS**, כדי שמי שאין לו גישה לתיבה באותו רגע לא ייתקע
      מחוץ לחשבון שלו. מרגע שיש יותר מדרך אחת, הבחירה ביניהן היא לוגיקה בפני
      עצמה — ועדיף שתהיה במקום אחד ולא פזורה בתוך זרימת ההתחברות.

      IsAvailable נבדק **לכל משתמש בנפרד**: ערוץ ה-SMS זמין רק אם גם מוגדר ספק
      וגם המשתמש רשם מספר טלפון. ערוץ שאינו זמין לא מוצע ולא נבחר.
    */
    public interface ITwoFactorChannel
    {
        /* מזהה קבוע לשמירה במסד ולתקשורת עם הלקוח: "email" / "sms". */
        string Key { get; }

        bool IsAvailableFor(User user);

        /* תיאור מצונזר להצגה למשתמש ("לכתובת a***@gmail.com"). */
        string Describe(User user);

        Task SendCodeAsync(User user, string code);
    }

    public class EmailTwoFactorChannel : ITwoFactorChannel
    {
        private readonly IEmailSender _email;

        public EmailTwoFactorChannel(IEmailSender email)
        {
            _email = email;
        }

        public string Key => TwoFactorChannels.Email;

        /* המייל הוא הזהות במערכת ולכן תמיד קיים — ערוץ ברירת המחדל. */
        public bool IsAvailableFor(User user) => !string.IsNullOrWhiteSpace(user.Email);

        public string Describe(User user) => MaskEmail(user.Email);

        public Task SendCodeAsync(User user, string code) =>
            _email.SendAsync(
                user.Email,
                "קוד כניסה — VaddyGo",
                "שלום 🙂\n\n" +
                $"קוד הכניסה שלך ל-VaddyGo הוא: {code}\n\n" +
                "הקוד תקף ל-10 דקות.\n\n" +
                "אם לא ניסית להתחבר עכשיו — מישהו יודע את הסיסמה שלך, " +
                "וכדאי להחליף אותה.\n\n" +
                "צוות VaddyGo 🩷");

        /*
          מצנזרים כדי שמסך הכניסה יזכיר לאיזו תיבה נשלח הקוד, בלי לחשוף את
          הכתובת המלאה למי שרק יודע את הסיסמה.
        */
        private static string MaskEmail(string email)
        {
            var at = email.IndexOf('@');
            if (at <= 0)
            {
                return "כתובת המייל שלך";
            }
            var name = email[..at];
            var domain = email[at..];
            var head = name[..1];
            return $"{head}{new string('*', Math.Max(name.Length - 1, 1))}{domain}";
        }
    }

    public class SmsTwoFactorChannel : ITwoFactorChannel
    {
        private readonly ISmsSender _sms;

        public SmsTwoFactorChannel(ISmsSender sms)
        {
            _sms = sms;
        }

        public string Key => TwoFactorChannels.Sms;

        /* שני תנאים: יש ספק מוגדר, ויש למשתמש טלפון מאומת. */
        public bool IsAvailableFor(User user) =>
            _sms.IsConfigured && !string.IsNullOrWhiteSpace(user.TwoFactorPhone);

        public string Describe(User user) => MaskPhone(FieldEncryption.Unprotect(user.TwoFactorPhone));

        public Task SendCodeAsync(User user, string code) =>
            _sms.SendAsync(
                FieldEncryption.Unprotect(user.TwoFactorPhone),
                $"קוד הכניסה שלך ל-VaddyGo: {code}");

        /* ארבע ספרות אחרונות בלבד — מספיק כדי לזהות את המכשיר שלך. */
        private static string MaskPhone(string phone)
        {
            var digits = new string(phone.Where(char.IsDigit).ToArray());
            return digits.Length < 4
                ? "הטלפון שלך"
                : $"***{digits[^4..]}";
        }
    }

    /* מזהי הערוצים במקום אחד — נשמרים במסד ונשלחים ללקוח. */
    public static class TwoFactorChannels
    {
        public const string Email = "email";
        public const string Sms = "sms";
    }
}
