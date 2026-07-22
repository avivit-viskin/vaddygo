using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      PaymentsController — קונטרולר דק לתשלומי תלמיד. מקונן תחת תלמיד:
      GET  api/students/{studentId}/payments             — מצב התשלומים לפי קטגוריות
      PUT  api/students/{studentId}/payments/{categoryId} — סימון/עדכון תשלום
    */
    [ApiController]
    [Route("api/students/{studentId}/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        /* המוסד הפעיל שהלקוח שולח בכותרת X-Institution (מזהה ה-Group). */
        private int? ActiveGroupId =>
            int.TryParse(Request.Headers["X-Institution"], out var id) ? id : null;

        // GET: api/payment-summaries — מצב התשלומים של כל תלמידי הגן בבקשה אחת
        // (מסלול מוחלט כדי לא להתנגש בניתוב המקונן api/students/{studentId}/payments)
        [HttpGet("/api/payment-summaries")]
        public async Task<ActionResult<IEnumerable<PaymentResponseDto>>> GetAllForGroup()
        {
            return Ok(await _paymentService.GetAllForGroupAsync(ActiveGroupId));
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymentResponseDto>>> GetForStudent(int studentId)
        {
            var payments = await _paymentService.GetForStudentAsync(studentId);
            if (payments == null)
                return NotFound(new { message = "תלמיד לא נמצא" });
            return Ok(payments);
        }

        [HttpPut("{categoryId}")]
        public async Task<ActionResult<PaymentResponseDto>> Upsert(
            int studentId, int categoryId, [FromBody] PaymentUpsertDto dto)
        {
            var saved = await _paymentService.UpsertAsync(studentId, categoryId, dto);
            if (saved == null)
                return NotFound(new { message = "התלמיד או הקטגוריה לא נמצאו" });
            return Ok(saved);
        }
    }
}
