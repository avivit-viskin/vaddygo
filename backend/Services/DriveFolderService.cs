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
        private readonly IAccessScope _access;
        private readonly ILogger<DriveFolderService> _logger;

        public DriveFolderService(IRepository<DriveFolder> folders, IAccessScope access, ILogger<DriveFolderService> logger)
        {
            _folders = folders;
            _access = access;
            _logger = logger;
        }

        public async Task<List<DriveFolderResponseDto>> GetAllAsync(int? groupId = null)
        {
            // בעלות: מסננים לגן שבבעלות המשתמש בלבד; מזהה מוסד זר/חסר → ריק, לא "הכל".
            var scoped = await _access.ScopeGroupIdAsync(groupId);
            if (scoped == null)
            {
                return new List<DriveFolderResponseDto>();
            }
            var folders = (await _folders.GetAllAsync())
                .Where(f => f.GroupId == scoped.Value)
                .ToList();
            return folders.Select(ToResponse).ToList();
        }

        public async Task<DriveFolderResponseDto?> GetByIdAsync(int id)
        {
            var folder = await _folders.GetByIdAsync(id);
            // בעלות: אין גישה לתיקייה שאינה בגן של המשתמש המחובר (IDOR)
            if (folder == null || !await _access.CanAccessGroupAsync(folder.GroupId))
            {
                return null;
            }
            return ToResponse(folder);
        }

        public async Task<DriveFolderResponseDto> CreateAsync(DriveFolderCreateDto dto, int? groupId = null)
        {
            var folder = new DriveFolder();
            ApplyWrite(folder, dto);
            // בעלות: משייכים לגן שבבעלות המשתמש (מאומת מול ה-JWT), לא לערך גולמי מהלקוח
            var scoped = await _access.ScopeGroupIdAsync(groupId);
            // הרשאת עריכה: "צופה" אינו רשאי ליצור נתונים
            if (scoped != null && !await _access.CanEditGroupAsync(scoped)) throw new ForbiddenException();
            folder.GroupId = scoped;
            await _folders.AddAsync(folder);
            _logger.LogInformation("Drive folder created (Id: {FolderId})", folder.Id);
            return ToResponse(folder);
        }

        public async Task<DriveFolderResponseDto?> UpdateAsync(int id, DriveFolderUpdateDto dto)
        {
            var folder = await _folders.GetByIdAsync(id);
            // בעלות: אין לערוך תיקייה שאינה בגן של המשתמש המחובר (IDOR)
            if (folder == null || !await _access.CanAccessGroupAsync(folder.GroupId))
            {
                return null;
            }
            // הרשאת עריכה: "צופה" אינו רשאי לעדכן נתונים
            if (!await _access.CanEditGroupAsync(folder.GroupId)) throw new ForbiddenException();

            ApplyWrite(folder, dto);
            await _folders.UpdateAsync(folder);
            _logger.LogInformation("Drive folder updated (Id: {FolderId})", id);
            return ToResponse(folder);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var folder = await _folders.GetByIdAsync(id);
            // בעלות: אין למחוק תיקייה שאינה בגן של המשתמש המחובר (IDOR)
            if (folder == null || !await _access.CanAccessGroupAsync(folder.GroupId))
            {
                return false;
            }
            // הרשאת עריכה: "צופה" אינו רשאי למחוק נתונים
            if (!await _access.CanEditGroupAsync(folder.GroupId)) throw new ForbiddenException();

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
