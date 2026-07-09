using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      PaymentUpsertDto — עדכון מצב תשלום של תלמיד עבור קטגוריה (יצירה או עדכון).
      הוולידציה המותנית (IValidatableObject) רצה אוטומטית עם [ApiController]
      ומחזירה 400 עם הודעות בעברית.
    */
    public class PaymentUpsertDto : IValidatableObject
    {
        public decimal Amount { get; set; }

        /* אמצעי תשלום: bit / paybox / cash. חובה כשמסמנים ששולם. */
        public string? Method { get; set; }

        public bool IsPaid { get; set; }

        private static readonly string[] AllowedMethods = { "bit", "paybox", "cash" };

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Amount < 0)
            {
                yield return new ValidationResult("הסכום לא יכול להיות שלילי", new[] { nameof(Amount) });
            }

            if (!string.IsNullOrEmpty(Method) && !AllowedMethods.Contains(Method))
            {
                yield return new ValidationResult("אמצעי תשלום לא תקין", new[] { nameof(Method) });
            }

            if (IsPaid && string.IsNullOrEmpty(Method))
            {
                yield return new ValidationResult("יש לבחור אמצעי תשלום כדי לסמן ששולם", new[] { nameof(Method) });
            }
        }
    }
}
