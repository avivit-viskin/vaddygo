using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      AccountController — פעולות על חשבון המשתמש המחובר. מחיקת החשבון מוחקת
      לצמיתות את המשתמש ואת כל הנתונים שלו (הזכות להימחק, חוק הגנת הפרטיות).
      דורש token תקף (מדיניות ברירת המחדל) — מוחקים תמיד רק את החשבון של השולח.
    */
    [ApiController]
    [Route("api/account")]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly IDataExportService _dataExport;
        private readonly IAccessScope _access;

        public AccountController(
            IAccountService accountService,
            IDataExportService dataExport,
            IAccessScope access)
        {
            _accountService = accountService;
            _dataExport = dataExport;
            _access = access;
        }

        /*
          GET api/account/export — "זכות העיון": כל המידע השמור על המשתמשת
          ועל הגנים שבבעלותה, בקובץ JSON אחד. דורש token תקף, ומחזיר תמיד
          את המידע של השולחת בלבד.
        */
        [HttpGet("export")]
        public async Task<IActionResult> ExportMyData()
        {
            var userId = _access.UserId;
            if (userId == null)
            {
                return Unauthorized();
            }

            var data = await _dataExport.ExportAsync(userId.Value);
            if (data == null)
            {
                return NotFound(new { message = "המשתמש לא נמצא" });
            }

            // שם קובץ עם תאריך — כדי שכמה ייצואים לא ידרסו זה את זה אצל המשתמשת
            var fileName = $"vaddygo-my-data-{DateTime.UtcNow:yyyy-MM-dd}.json";
            Response.Headers.ContentDisposition = $"attachment; filename=\"{fileName}\"";
            return Ok(data);
        }

        // DELETE api/account — מחיקת החשבון של המשתמש המחובר וכל הנתונים שלו
        [HttpDelete]
        public async Task<IActionResult> DeleteMyAccount()
        {
            var userId = _access.UserId;
            if (userId == null)
            {
                return Unauthorized();
            }

            await _accountService.DeleteAccountAsync(userId.Value);
            return NoContent();
        }
    }
}
