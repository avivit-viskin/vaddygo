using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    public interface IGroupService
    {
        Task<List<GroupResponseDto>> GetAllAsync();
        Task<GroupResponseDto?> GetByIdAsync(int id);
        Task<GroupResponseDto> CreateAsync(GroupCreateDto dto);
    }
}
