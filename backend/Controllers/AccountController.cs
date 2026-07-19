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
        private readonly IAccessScope _access;

        public AccountController(IAccountService accountService, IAccessScope access)
        {
            _accountService = accountService;
            _access = access;
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
