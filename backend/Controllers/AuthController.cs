using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      AuthController — הרשמה וכניסה פתוחות לכולם (AllowAnonymous על כל פעולה) כי
      כאן מקבלים את ה-token; שינוי סיסמה דורש token (Authorize).
    */
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // POST: api/auth/register
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto);
            if (result.Error != null)
                return Conflict(new { message = result.Error });
            return Ok(result.Response);
        }

        // POST: api/auth/login
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            if (result.Error != null)
                return Unauthorized(new { message = result.Error });
            return Ok(result.Response);
        }

        // POST: api/auth/google — כניסה/הרשמה עם Google (מאמת את ה-credential מול גוגל)
        [AllowAnonymous]
        [HttpPost("google")]
        public async Task<ActionResult<AuthResponseDto>> Google([FromBody] GoogleLoginDto dto)
        {
            var result = await _authService.LoginWithGoogleAsync(dto);
            if (result.Error != null)
                return Unauthorized(new { message = result.Error });
            return Ok(result.Response);
        }

        // POST: api/auth/change-password — שינוי סיסמה למשתמש מחובר (דורש token)
        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var error = await _authService.ChangePasswordAsync(dto);
            if (error != null)
                return BadRequest(new { message = error });
            return Ok(new { message = "הסיסמה שונתה בהצלחה" });
        }
    }
}
