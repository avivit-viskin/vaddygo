using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;
using ParentCommitteeAPI.Repositories;

namespace ParentCommitteeAPI.Services
{
    /*
      EventService — הלוגיקה העסקית של אירועי לוח השנה: מיפוי DTO ↔ מודל וניקוי קלט.
      לוגים בלי מידע רגיש — מזהים בלבד.
    */
    public class EventService : IEventService
    {
        private readonly IRepository<Event> _events;
        private readonly ILogger<EventService> _logger;

        public EventService(IRepository<Event> events, ILogger<EventService> logger)
        {
            _events = events;
            _logger = logger;
        }

        public async Task<List<EventResponseDto>> GetAllAsync(int? groupId = null)
        {
            var events = await _events.GetAllAsync();
            if (groupId.HasValue)
            {
                events = events.Where(e => e.GroupId == null || e.GroupId == groupId.Value).ToList();
            }
            return events
                .OrderBy(e => e.EventDate)
                .Select(ToResponse)
                .ToList();
        }

        public async Task<EventResponseDto?> GetByIdAsync(int id)
        {
            var item = await _events.GetByIdAsync(id);
            return item == null ? null : ToResponse(item);
        }

        public async Task<EventResponseDto> CreateAsync(EventCreateDto dto, int? groupId = null)
        {
            var item = new Event();
            ApplyWrite(item, dto);
            item.GroupId = groupId;
            await _events.AddAsync(item);
            _logger.LogInformation("Event created (Id: {EventId})", item.Id);
            return ToResponse(item);
        }

        public async Task<EventResponseDto?> UpdateAsync(int id, EventUpdateDto dto)
        {
            var item = await _events.GetByIdAsync(id);
            if (item == null)
            {
                return null;
            }

            ApplyWrite(item, dto);
            await _events.UpdateAsync(item);
            _logger.LogInformation("Event updated (Id: {EventId})", id);
            return ToResponse(item);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var item = await _events.GetByIdAsync(id);
            if (item == null)
            {
                return false;
            }

            await _events.DeleteAsync(item);
            _logger.LogInformation("Event deleted (Id: {EventId})", id);
            return true;
        }

        /* מיפוי משותף ל-Create ול-Update; התאריך נשמר כתאריך בלבד (בלי שעה) */
        private static void ApplyWrite(Event item, EventWriteDto dto)
        {
            item.Name = dto.Name.Trim();
            item.EventDate = dto.EventDate!.Value.Date;
            item.Description = dto.Description.Trim();
            item.Location = dto.Location.Trim();
            item.Reminder = dto.Reminder;
        }

        private static EventResponseDto ToResponse(Event item) => new()
        {
            Id = item.Id,
            Name = item.Name,
            EventDate = item.EventDate,
            Description = item.Description,
            Location = item.Location,
            Reminder = item.Reminder,
        };
    }
}
