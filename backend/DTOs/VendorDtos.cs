using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      VendorWriteDto — הבסיס המשותף להוספה ולעריכה של ספק (UI_SPEC ס' 12):
      שם, קישור לקטלוג, וואטסאפ, מוצרים (עם תמונה) וקישורים לרשתות חברתיות.
    */
    public abstract class VendorWriteDto
    {
        [Required(ErrorMessage = "שם הספק הוא שדה חובה")]
        [StringLength(80, ErrorMessage = "שם הספק יכול להכיל עד 80 תווים")]
        public string Name { get; set; } = string.Empty;

        [StringLength(300, ErrorMessage = "הקישור ארוך מדי")]
        public string CatalogUrl { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "פרטי הוואטסאפ ארוכים מדי")]
        public string WhatsApp { get; set; } = string.Empty;

        [StringLength(40, ErrorMessage = "הקטגוריה ארוכה מדי")]
        public string Category { get; set; } = string.Empty;

        [StringLength(60, ErrorMessage = "שם העיר/אזור ארוך מדי")]
        public string City { get; set; } = string.Empty;

        [StringLength(300, ErrorMessage = "קישור התשלום ארוך מדי")]
        public string PaymentLink { get; set; } = string.Empty;

        [StringLength(40, ErrorMessage = "מספר הביט ארוך מדי")]
        public string PaymentBit { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "פרטי ההעברה ארוכים מדי")]
        public string PaymentBankInfo { get; set; } = string.Empty;

        [Range(0, 24, ErrorMessage = "מספר התשלומים חייב להיות בין 0 ל-24")]
        public int PaymentInstallments { get; set; }

        public List<VendorProductDto> Products { get; set; } = new();
        public List<VendorSocialLinkDto> SocialLinks { get; set; } = new();
    }

    public class VendorProductDto
    {
        [Required(ErrorMessage = "שם המוצר הוא שדה חובה")]
        [StringLength(80, ErrorMessage = "שם המוצר יכול להכיל עד 80 תווים")]
        public string Name { get; set; } = string.Empty;

        [Range(0, 1000000, ErrorMessage = "המחיר חייב להיות בין 0 ל-1,000,000")]
        public decimal Price { get; set; }

        // מכיל קישור (URL) או תמונה מוטמעת (base64 data-URI) שהספק העלה מהטלפון —
        // ולכן המגבלה גבוהה. התמונה מכווצת בצד הלקוח כדי להישאר קטנה.
        [StringLength(3_000_000, ErrorMessage = "קובץ התמונה גדול מדי")]
        public string ImageUrl { get; set; } = string.Empty;

        [StringLength(40, ErrorMessage = "שם התיקייה ארוך מדי")]
        public string Folder { get; set; } = string.Empty;
    }

    public class VendorSocialLinkDto
    {
        [StringLength(40, ErrorMessage = "שם הרשת ארוך מדי")]
        public string Label { get; set; } = string.Empty;

        [Required(ErrorMessage = "קישור הרשת החברתית הוא שדה חובה")]
        [StringLength(300, ErrorMessage = "הקישור ארוך מדי")]
        public string Url { get; set; } = string.Empty;
    }

    /* פרטי התחברות שהספק מגדיר לעצמו (כדי לחזור בלי הקישור) */
    public class VendorCredentialsDto
    {
        [Required(ErrorMessage = "צריך כתובת מייל")]
        [EmailAddress(ErrorMessage = "כתובת המייל אינה תקינה")]
        [StringLength(120, ErrorMessage = "כתובת המייל ארוכה מדי")]
        public string LoginEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך סיסמה")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "הסיסמה חייבת להכיל 6 תווים לפחות")]
        public string Password { get; set; } = string.Empty;
    }

    /* בקשת התחברות ספק — מאמתת מייל+סיסמה ומחזירה את טוקן העריכה */
    public class VendorLoginDto
    {
        [Required(ErrorMessage = "צריך כתובת מייל")]
        public string LoginEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך סיסמה")]
        public string Password { get; set; } = string.Empty;
    }

    /* בקשת קוד איפוס סיסמה לספק — הקוד נשלח למייל שהספק הגדיר */
    public class VendorForgotPasswordDto
    {
        [Required(ErrorMessage = "צריך כתובת מייל")]
        [EmailAddress(ErrorMessage = "כתובת המייל אינה תקינה")]
        public string Email { get; set; } = string.Empty;
    }

    /* איפוס סיסמה לספק — הקוד מהמייל + סיסמה חדשה */
    public class VendorResetPasswordDto
    {
        [Required(ErrorMessage = "צריך כתובת מייל")]
        public string LoginEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך את הקוד מהמייל")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך סיסמה חדשה")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "הסיסמה חייבת להכיל 6 תווים לפחות")]
        public string NewPassword { get; set; } = string.Empty;
    }

    /* הרשמת ספק חדש בעצמו — שם עסק + מייל + סיסמה. נוצרת רשומת ספק חדשה עם
       טוקן עריכה, והספק ממשיך למלא את הכרטיס והמוצרים שלו. */
    public class VendorRegisterDto
    {
        [Required(ErrorMessage = "צריך שם עסק/ספק")]
        [StringLength(80, ErrorMessage = "שם העסק ארוך מדי")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך כתובת מייל")]
        [EmailAddress(ErrorMessage = "כתובת המייל אינה תקינה")]
        [StringLength(120, ErrorMessage = "כתובת המייל ארוכה מדי")]
        public string LoginEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך סיסמה")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "הסיסמה חייבת להכיל 6 תווים לפחות")]
        public string Password { get; set; } = string.Empty;
    }

    public class VendorCreateDto : VendorWriteDto
    {
    }

    public class VendorUpdateDto : VendorWriteDto
    {
    }

    public class VendorResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string CatalogUrl { get; set; } = string.Empty;
        public string WhatsApp { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string PaymentLink { get; set; } = string.Empty;
        public string PaymentBit { get; set; } = string.Empty;
        public string PaymentBankInfo { get; set; } = string.Empty;
        public int PaymentInstallments { get; set; }
        public List<VendorProductResponseDto> Products { get; set; } = new();
        public List<VendorSocialLinkResponseDto> SocialLinks { get; set; } = new();
    }

    public class VendorProductResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string Folder { get; set; } = string.Empty;
    }

    public class VendorSocialLinkResponseDto
    {
        public int Id { get; set; }
        public string Label { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }
}
