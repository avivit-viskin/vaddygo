using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      ExpensesController — קונטרולר דק להוצאות הקופה (משימת "עריכת יתרת הקופה").
      הבעלות/סינון נגזרים בשירות מהמשתמש המחובר; X-Institution הוא העדפת תצוגה בלבד.
    */
    [ApiController]
    [Route("api/[controller]")]
    public class ExpensesController : ControllerBase
    {
        private readonly IExpenseService _expenseService;

        public ExpensesController(IExpenseService expenseService)
        {
            _expenseService = expenseService;
        }

        /* המוסד הפעיל שהלקוח שולח בכותרת X-Institution (מזהה ה-Group). */
        private int? ActiveGroupId =>
            int.TryParse(Request.Headers["X-Institution"], out var id) ? id : null;

        // GET: api/expenses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ExpenseResponseDto>>> GetAllExpenses()
        {
            return Ok(await _expenseService.GetAllAsync(ActiveGroupId));
        }

        // POST: api/expenses
        [HttpPost]
        public async Task<ActionResult<ExpenseResponseDto>> CreateExpense([FromBody] ExpenseCreateDto dto)
        {
            var created = await _expenseService.CreateAsync(dto, ActiveGroupId);
            return CreatedAtAction(nameof(GetAllExpenses), new { id = created.Id }, created);
        }

        // DELETE: api/expenses/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExpense(int id)
        {
            var deleted = await _expenseService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = "ההוצאה לא נמצאה" });
            return NoContent();
        }
    }
}
