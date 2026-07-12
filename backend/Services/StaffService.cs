using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;
using ParentCommitteeAPI.Repositories;

namespace ParentCommitteeAPI.Services
{
    /*
      StaffService — הלוגיקה העסקית של אנשי הצוות: מיפוי DTO ↔ מודל וניקוי קלט.
      לוגים בלי מידע רגיש — מזהים בלבד.
    */
    public class StaffService : IStaffService
    {
        private readonly IRepository<StaffMember> _staff;
        private readonly IAccessScope _access;
        private readonly ILogger<StaffService> _logger;

        public StaffService(IRepository<StaffMember> staff, IAccessScope access, ILogger<StaffService> logger)
        {
            _staff = staff;
            _access = access;
            _logger = logger;
        }

        public async Task<List<StaffMemberResponseDto>> GetAllAsync(int? groupId = null)
        {
            // בעלות: מסננים לגן שבבעלות המשתמש בלבד; מזהה מוסד זר/חסר → ריק, לא "הכל".
            var scoped = await _access.ScopeGroupIdAsync(groupId);
            if (scoped == null)
            {
                return new List<StaffMemberResponseDto>();
            }
            var members = (await _staff.GetAllAsync())
                .Where(m => m.GroupId == scoped.Value)
                .ToList();
            return members.Select(ToResponse).ToList();
        }

        public async Task<StaffMemberResponseDto?> GetByIdAsync(int id)
        {
            var member = await _staff.GetByIdAsync(id);
            // בעלות: אין גישה לאיש צוות שאינו בגן של המשתמש המחובר (IDOR)
            if (member == null || !await _access.CanAccessGroupAsync(member.GroupId))
            {
                return null;
            }
            return ToResponse(member);
        }

        public async Task<StaffMemberResponseDto> CreateAsync(StaffMemberCreateDto dto, int? groupId = null)
        {
            var member = new StaffMember();
            ApplyWrite(member, dto);
            // בעלות: משייכים לגן שבבעלות המשתמש (מאומת מול ה-JWT), לא לערך גולמי מהלקוח
            member.GroupId = await _access.ScopeGroupIdAsync(groupId);
            await _staff.AddAsync(member);
            _logger.LogInformation("Staff member created (Id: {StaffId})", member.Id);
            return ToResponse(member);
        }

        public async Task<StaffMemberResponseDto?> UpdateAsync(int id, StaffMemberUpdateDto dto)
        {
            var member = await _staff.GetByIdAsync(id);
            // בעלות: אין לערוך איש צוות שאינו בגן של המשתמש המחובר (IDOR)
            if (member == null || !await _access.CanAccessGroupAsync(member.GroupId))
            {
                return null;
            }

            ApplyWrite(member, dto);
            await _staff.UpdateAsync(member);
            _logger.LogInformation("Staff member updated (Id: {StaffId})", id);
            return ToResponse(member);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var member = await _staff.GetByIdAsync(id);
            // בעלות: אין למחוק איש צוות שאינו בגן של המשתמש המחובר (IDOR)
            if (member == null || !await _access.CanAccessGroupAsync(member.GroupId))
            {
                return false;
            }

            await _staff.DeleteAsync(member);
            _logger.LogInformation("Staff member deleted (Id: {StaffId})", id);
            return true;
        }

        /* מיפוי משותף ל-Create ול-Update; BirthDate נשמר כתאריך בלבד (בלי שעה) */
        private static void ApplyWrite(StaffMember member, StaffMemberWriteDto dto)
        {
            member.FullName = dto.FullName.Trim();
            member.Role = dto.Role.Trim();
            member.BirthDate = dto.BirthDate!.Value.Date;
        }

        private static StaffMemberResponseDto ToResponse(StaffMember member) => new()
        {
            Id = member.Id,
            FullName = member.FullName,
            Role = member.Role,
            BirthDate = member.BirthDate,
        };
    }
}
