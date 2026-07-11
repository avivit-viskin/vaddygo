using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      AuthController — הרשמה וכניסה. פתוח לכולם (AllowAnonymous) כי כאן מקבלים
      את ה-token; כל שאר הקונטרולרים דורשים token דרך מדיניות ברירת המחדל.
    */
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto);
            if (result.Error != null)
                return Conflict(new { message = result.Error });
            return Ok(result.Response);
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            if (result.Error != null)
                return Unauthorized(new { message = result.Error });
            return Ok(result.Response);
        }

        // POST: api/auth/google — כניסה/הרשמה עם Google (מאמת את ה-credential מול גוגל)
        [HttpPost("google")]
        public async Task<ActionResult<AuthResponseDto>> Google([FromBody] GoogleLoginDto dto)
        {
            var result = await _authService.LoginWithGoogleAsync(dto);
            if (result.Error != null)
                return Unauthorized(new { message = result.Error });
            return Ok(result.Response);
        }
    }
}
