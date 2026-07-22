using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    public interface ITeamService
    {
        /* רשימת חברי הצוות + ההזמנות הממתינות של הגן הפעיל (כל חבר רשאי לצפות). */
        Task<TeamResponseDto?> GetTeamAsync(int? activeGroupId);

        /* יצירת הזמנה (מנהל בלבד) — מחזיר טוקן לבניית קישור ההזמנה. */
        Task<InviteResponseDto?> CreateInviteAsync(int? activeGroupId, InviteCreateDto dto);

        /* ביטול הזמנה ממתינה (מנהל בלבד). */
        Task<bool> CancelInviteAsync(int? activeGroupId, int inviteId);

        /* הסרת חבר צוות (מנהל בלבד). */
        Task<bool> RemoveMemberAsync(int? activeGroupId, int memberId);

        /* שינוי הרשאה של חבר צוות (מנהל בלבד). */
        Task<bool> UpdateMemberRoleAsync(int? activeGroupId, int memberId, string role);

        /* תצוגה מקדימה של הזמנה לפי טוקן (לעמוד ההצטרפות). */
        Task<InvitePreviewDto?> PreviewInviteAsync(string token);

        /* המשתמש המחובר "פודה" את הטוקן ומצטרף לגן עם ההרשאה שבהזמנה. */
        Task<InvitePreviewDto?> AcceptInviteAsync(string token);
    }
}
