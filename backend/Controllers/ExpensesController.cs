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

        // DELETE: api/expenses/1 — מחיקה רכה (לסל המיחזור)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExpense(int id)
        {
            var deleted = await _expenseService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = "ההוצאה לא נמצאה" });
            return NoContent();
        }

        // GET: api/expenses/trash — פריטי סל המיחזור (נמחקו ב-30 הימים האחרונים)
        [HttpGet("trash")]
        public async Task<ActionResult<IEnumerable<ExpenseResponseDto>>> GetTrash()
        {
            return Ok(await _expenseService.GetTrashAsync(ActiveGroupId));
        }

        // POST: api/expenses/1/restore — שחזור פריט מסל המיחזור
        [HttpPost("{id}/restore")]
        public async Task<IActionResult> RestoreExpense(int id)
        {
            var restored = await _expenseService.RestoreAsync(id);
            if (!restored)
                return NotFound(new { message = "הפריט לא נמצא בסל המיחזור" });
            return NoContent();
        }

        // DELETE: api/expenses/1/permanent — מחיקה לצמיתות מסל המיחזור
        [HttpDelete("{id}/permanent")]
        public async Task<IActionResult> PermanentDeleteExpense(int id)
        {
            var deleted = await _expenseService.PermanentDeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = "הפריט לא נמצא בסל המיחזור" });
            return NoContent();
        }
    }
}
