using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;
using ParentCommitteeAPI.Repositories;

namespace ParentCommitteeAPI.Services
{
    /*
      DriveFolderService — הלוגיקה העסקית של קישורי התיקיות: מיפוי DTO ↔ מודל
      וניקוי קלט. משתמש ב-Repository הגנרי — ישות פשוטה בלי Owned.
    */
    public class DriveFolderService : IDriveFolderService
    {
        private readonly IRepository<DriveFolder> _folders;
        private readonly ILogger<DriveFolderService> _logger;

        public DriveFolderService(IRepository<DriveFolder> folders, ILogger<DriveFolderService> logger)
        {
            _folders = folders;
            _logger = logger;
        }

        public async Task<List<DriveFolderResponseDto>> GetAllAsync(int? groupId = null)
        {
            var folders = await _folders.GetAllAsync();
            if (groupId.HasValue)
            {
                folders = folders.Where(f => f.GroupId == groupId.Value).ToList();
            }
            return folders.Select(ToResponse).ToList();
        }

        public async Task<DriveFolderResponseDto?> GetByIdAsync(int id)
        {
            var folder = await _folders.GetByIdAsync(id);
            return folder == null ? null : ToResponse(folder);
        }

        public async Task<DriveFolderResponseDto> CreateAsync(DriveFolderCreateDto dto, int? groupId = null)
        {
            var folder = new DriveFolder();
            ApplyWrite(folder, dto);
            folder.GroupId = groupId;
            await _folders.AddAsync(folder);
            _logger.LogInformation("Drive folder created (Id: {FolderId})", folder.Id);
            return ToResponse(folder);
        }

        public async Task<DriveFolderResponseDto?> UpdateAsync(int id, DriveFolderUpdateDto dto)
        {
            var folder = await _folders.GetByIdAsync(id);
            if (folder == null)
            {
                return null;
            }

            ApplyWrite(folder, dto);
            await _folders.UpdateAsync(folder);
            _logger.LogInformation("Drive folder updated (Id: {FolderId})", id);
            return ToResponse(folder);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var folder = await _folders.GetByIdAsync(id);
            if (folder == null)
            {
                return false;
            }

            await _folders.DeleteAsync(folder);
            _logger.LogInformation("Drive folder deleted (Id: {FolderId})", id);
            return true;
        }

        private static void ApplyWrite(DriveFolder folder, DriveFolderWriteDto dto)
        {
            folder.Name = dto.Name.Trim();
            folder.Url = dto.Url.Trim();
        }

        private static DriveFolderResponseDto ToResponse(DriveFolder folder) => new()
        {
            Id = folder.Id,
            Name = folder.Name,
            Url = folder.Url,
        };
    }
}
