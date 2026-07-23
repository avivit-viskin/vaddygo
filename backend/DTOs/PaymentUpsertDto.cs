using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      PaymentUpsertDto — עדכון תשלום של תלמיד עבור קטגוריה: סכום נפרד לכל
      אמצעי (ביט/פייבוקס/מזומן/אשראי) + סימון "שולם". הוולידציה המותנית רצה
      אוטומטית עם [ApiController] ומחזירה 400 עם הודעות בעברית.
    */
    public class PaymentUpsertDto : IValidatableObject
    {
        public decimal BitAmount { get; set; }
        public decimal PayBoxAmount { get; set; }
        public decimal CashAmount { get; set; }
        public decimal CardAmount { get; set; }

        public bool IsPaid { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (BitAmount < 0 || PayBoxAmount < 0 || CashAmount < 0 || CardAmount < 0)
            {
                yield return new ValidationResult(
                    "הסכום לא יכול להיות שלילי",
                    new[] { nameof(BitAmount), nameof(PayBoxAmount), nameof(CashAmount), nameof(CardAmount) });
            }

            if (IsPaid && BitAmount + PayBoxAmount + CashAmount + CardAmount <= 0)
            {
                yield return new ValidationResult(
                    "יש להזין סכום באחד האמצעים כדי לסמן ששולם",
                    new[] { nameof(BitAmount) });
            }
        }
    }
}
