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
        private readonly ILogger<StaffService> _logger;

        public StaffService(IRepository<StaffMember> staff, ILogger<StaffService> logger)
        {
            _staff = staff;
            _logger = logger;
        }

        public async Task<List<StaffMemberResponseDto>> GetAllAsync()
        {
            var members = await _staff.GetAllAsync();
            return members.Select(ToResponse).ToList();
        }

        public async Task<StaffMemberResponseDto?> GetByIdAsync(int id)
        {
            var member = await _staff.GetByIdAsync(id);
            return member == null ? null : ToResponse(member);
        }

        public async Task<StaffMemberResponseDto> CreateAsync(StaffMemberCreateDto dto)
        {
            var member = new StaffMember();
            ApplyWrite(member, dto);
            await _staff.AddAsync(member);
            _logger.LogInformation("Staff member created (Id: {StaffId})", member.Id);
            return ToResponse(member);
        }

        public async Task<StaffMemberResponseDto?> UpdateAsync(int id, StaffMemberUpdateDto dto)
        {
            var member = await _staff.GetByIdAsync(id);
            if (member == null)
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
            if (member == null)
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
