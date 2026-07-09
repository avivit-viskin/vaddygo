using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    public interface IJwtTokenService
    {
        // מפיק JWT חתום עבור המשתמש, שתוקפו כתוקף המנוי
        string CreateToken(User user);
    }
}
