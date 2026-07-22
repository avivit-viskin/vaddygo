using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      CardPaymentsController — סליקת אשראי דרך ספק חיצוני:
      POST api/students/{studentId}/payments/{categoryId}/card-checkout — פותח תשלום
           ומחזיר את כתובת עמוד התשלום המאובטח של הספק (דורש התחברות + בעלות).
      POST api/payments/card-webhook — קריאת אישור משרת-לשרת מהספק (בלי JWT);
           האבטחה היא אימות החתימה/הסוד בתוך שכבת הספק.
    */
    [ApiController]
    public class CardPaymentsController : ControllerBase
    {
        private readonly ICardPaymentService _cardPayments;

        public CardPaymentsController(ICardPaymentService cardPayments)
        {
            _cardPayments = cardPayments;
        }

        [HttpPost("api/students/{studentId}/payments/{categoryId}/card-checkout")]
        public async Task<IActionResult> Checkout(int studentId, int categoryId)
        {
            var result = await _cardPayments.StartCheckoutAsync(studentId, categoryId);
            if (result == null)
            {
                return NotFound(new { message = "התלמיד או הקטגוריה לא נמצאו" });
            }
            return Ok(new { paymentUrl = result.PaymentUrl });
        }

        // תשלום אשראי לכל החוב הפתוח של התלמיד (סכום כל הקטגוריות שטרם שולמו)
        [HttpPost("api/students/{studentId}/card-checkout")]
        public async Task<IActionResult> CheckoutStudent(int studentId)
        {
            var result = await _cardPayments.StartStudentCheckoutAsync(studentId);
            if (result == null)
            {
                return NotFound(new { message = "אין חוב פתוח לתלמיד, או שלא נמצא" });
            }
            return Ok(new { paymentUrl = result.PaymentUrl });
        }

        [AllowAnonymous]
        [HttpPost("api/payments/card-webhook")]
        public async Task<IActionResult> Webhook()
        {
            using var reader = new StreamReader(Request.Body);
            var body = await reader.ReadToEndAsync();
            var ok = await _cardPayments.HandleWebhookAsync(body, Request.Headers);
            return ok ? Ok() : BadRequest();
        }
    }
}
