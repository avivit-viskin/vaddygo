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
        private readonly ILogger<GiftService> _logger;

        public GiftService(IRepository<Gift> gifts, ILogger<GiftService> logger)
        {
            _gifts = gifts;
            _logger = logger;
        }

        public async Task<List<GiftResponseDto>> GetAllAsync(int? groupId = null)
        {
            var gifts = await _gifts.GetAllAsync();
            if (groupId.HasValue)
            {
                gifts = gifts.Where(g => g.GroupId == null || g.GroupId == groupId.Value).ToList();
            }
            return gifts.Select(ToResponse).ToList();
        }

        public async Task<GiftResponseDto?> GetByIdAsync(int id)
        {
            var gift = await _gifts.GetByIdAsync(id);
            return gift == null ? null : ToResponse(gift);
        }

        public async Task<GiftResponseDto> CreateAsync(GiftCreateDto dto, int? groupId = null)
        {
            var gift = new Gift();
            ApplyWrite(gift, dto);
            gift.GroupId = groupId;
            await _gifts.AddAsync(gift);
            _logger.LogInformation("Gift created (Id: {GiftId})", gift.Id);
            return ToResponse(gift);
        }

        public async Task<GiftResponseDto?> UpdateAsync(int id, GiftUpdateDto dto)
        {
            var gift = await _gifts.GetByIdAsync(id);
            if (gift == null)
            {
                return null;
            }

            ApplyWrite(gift, dto);
            await _gifts.UpdateAsync(gift);
            _logger.LogInformation("Gift updated (Id: {GiftId})", id);
            return ToResponse(gift);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var gift = await _gifts.GetByIdAsync(id);
            if (gift == null)
            {
                return false;
            }

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
