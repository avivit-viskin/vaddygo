using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;
using ParentCommitteeAPI.Repositories;

namespace ParentCommitteeAPI.Services
{
    /*
      GiftService — הלוגיקה העסקית של המתנות: מיפוי DTO ↔ מודל וניקוי קלט.
      משתמש ב-Repository הגנרי — למתנה אין ישויות Owned (הספק הוא קישור בלבד).
    */
    public class GiftService : IGiftService
    {
        private readonly IRepository<Gift> _gifts;
        private readonly IAccessScope _access;
        private readonly ILogger<GiftService> _logger;

        public GiftService(IRepository<Gift> gifts, IAccessScope access, ILogger<GiftService> logger)
        {
            _gifts = gifts;
            _access = access;
            _logger = logger;
        }

        public async Task<List<GiftResponseDto>> GetAllAsync(int? groupId = null)
        {
            // בעלות: מסננים לגן שבבעלות המשתמש בלבד; מזהה מוסד זר/חסר → ריק, לא "הכל".
            var scoped = await _access.ScopeGroupIdAsync(groupId);
            if (scoped == null)
            {
                return new List<GiftResponseDto>();
            }
            var gifts = (await _gifts.GetAllAsync())
                .Where(g => g.GroupId == scoped.Value)
                .ToList();
            return gifts.Select(ToResponse).ToList();
        }

        public async Task<GiftResponseDto?> GetByIdAsync(int id)
        {
            var gift = await _gifts.GetByIdAsync(id);
            // בעלות: אין גישה למתנה שאינה בגן של המשתמש המחובר (IDOR)
            if (gift == null || !await _access.CanAccessGroupAsync(gift.GroupId))
            {
                return null;
            }
            return ToResponse(gift);
        }

        public async Task<GiftResponseDto> CreateAsync(GiftCreateDto dto, int? groupId = null)
        {
            var gift = new Gift();
            ApplyWrite(gift, dto);
            // בעלות: משייכים לגן שבבעלות המשתמש (מאומת מול ה-JWT), לא לערך גולמי מהלקוח
            var scoped = await _access.ScopeGroupIdAsync(groupId);
            // הרשאת עריכה: "צופה" אינו רשאי ליצור נתונים
            if (scoped != null && !await _access.CanEditGroupAsync(scoped)) throw new ForbiddenException();
            gift.GroupId = scoped;
            await _gifts.AddAsync(gift);
            _logger.LogInformation("Gift created (Id: {GiftId})", gift.Id);
            return ToResponse(gift);
        }

        public async Task<GiftResponseDto?> UpdateAsync(int id, GiftUpdateDto dto)
        {
            var gift = await _gifts.GetByIdAsync(id);
            // בעלות: אין לערוך מתנה שאינה בגן של המשתמש המחובר (IDOR)
            if (gift == null || !await _access.CanAccessGroupAsync(gift.GroupId))
            {
                return null;
            }
            // הרשאת עריכה: "צופה" אינו רשאי לעדכן נתונים
            if (!await _access.CanEditGroupAsync(gift.GroupId)) throw new ForbiddenException();

            ApplyWrite(gift, dto);
            await _gifts.UpdateAsync(gift);
            _logger.LogInformation("Gift updated (Id: {GiftId})", id);
            return ToResponse(gift);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var gift = await _gifts.GetByIdAsync(id);
            // בעלות: אין למחוק מתנה שאינה בגן של המשתמש המחובר (IDOR)
            if (gift == null || !await _access.CanAccessGroupAsync(gift.GroupId))
            {
                return false;
            }
            // הרשאת עריכה: "צופה" אינו רשאי למחוק נתונים
            if (!await _access.CanEditGroupAsync(gift.GroupId)) throw new ForbiddenException();

            await _gifts.DeleteAsync(gift);
            _logger.LogInformation("Gift deleted (Id: {GiftId})", id);
            return true;
        }

        private static void ApplyWrite(Gift gift, GiftWriteDto dto)
        {
            gift.Name = dto.Name.Trim();
            gift.HolidayKey = string.IsNullOrWhiteSpace(dto.HolidayKey) ? null : dto.HolidayKey.Trim();
            gift.HolidayName = string.IsNullOrWhiteSpace(dto.HolidayName) ? null : dto.HolidayName.Trim();
            gift.TotalAmount = dto.TotalAmount;
            gift.Status = dto.Status;
            gift.VendorId = dto.VendorId;
        }

        private static GiftResponseDto ToResponse(Gift gift) => new()
        {
            Id = gift.Id,
            Name = gift.Name,
            HolidayKey = gift.HolidayKey,
            HolidayName = gift.HolidayName,
            TotalAmount = gift.TotalAmount,
            Status = gift.Status,
            VendorId = gift.VendorId,
        };
    }
}
