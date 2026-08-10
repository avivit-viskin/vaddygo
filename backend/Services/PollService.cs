using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      PollService — הלוגיקה של הסקרים. עובד ישירות מול DbContext (ולא דרך ה-
      Repository הגנרי) כי לסקר יש ילדים שנטענים איתו תמיד (Options) והצבעות
      שצריך לספור — בדיוק כמו VendorService.

      שתי דרכי גישה, בכוונה נפרדות:
      • הוועד — מזוהה ב-JWT, ורואה/מנהל רק את סקרי הגן שלו.
      • ההורה — מזוהה רק בטוקן הציבורי של הסקר, ויכול *רק* לקרוא ולהצביע.
    */
    public class PollService : IPollService
    {
        private readonly AppDbContext _db;
        private readonly IAccessScope _access;
        private readonly ILogger<PollService> _logger;

        public PollService(AppDbContext db, IAccessScope access, ILogger<PollService> logger)
        {
            _db = db;
            _access = access;
            _logger = logger;
        }

        private IQueryable<Poll> WithOptions() =>
            _db.Polls.Include(p => p.Options);

        public async Task<IEnumerable<PollResponseDto>> GetAllAsync(int? groupId = null)
        {
            // בעלות: רק הגן של המשתמש; מוסד זר/חסר → רשימה ריקה, לא "הכל".
            var scoped = await _access.ScopeGroupIdAsync(groupId);
            if (scoped == null)
            {
                return new List<PollResponseDto>();
            }
            var polls = await WithOptions()
                .Where(p => p.GroupId == scoped.Value)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
            return polls.Select(ToResponse).ToList();
        }

        public async Task<PollResponseDto?> CreateAsync(PollCreateDto dto, int? groupId = null)
        {
            var options = (dto.Options ?? new List<string>())
                .Select(t => (t ?? string.Empty).Trim())
                .Where(t => t.Length > 0)
                .Take(20)
                .ToList();
            if (options.Count < 2)
            {
                return null; // הקונטרולר מתרגם ל-400 עם הודעה בעברית
            }

            var scoped = await _access.ScopeGroupIdAsync(groupId);
            // הרשאת עריכה: "צופה" אינו רשאי ליצור סקר
            if (scoped != null && !await _access.CanEditGroupAsync(scoped))
            {
                throw new ForbiddenException();
            }
            // אכיפת פרו בשרת: סקרים הם פיצ'ר פרו. הלקוח כבר חוסם את המסך, אבל
            // הנתונים עצמם נחסמים כאן — אחרת עקיפה של הממשק הייתה מספיקה.
            if (!await _access.IsGroupProAsync(scoped))
            {
                throw new ProRequiredException("סקרים והצבעות הם פיצ'ר של מסלול פרו.");
            }

            var poll = new Poll
            {
                GroupId = scoped,
                Question = dto.Question.Trim(),
                // GUID ללא מקפים — כתובת ציבורית שאי אפשר לנחש
                PublicToken = Guid.NewGuid().ToString("N"),
                Options = options.Select(t => new PollOption { Text = t }).ToList(),
            };

            _db.Polls.Add(poll);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Poll created (Id: {PollId}, Options: {Count})",
                poll.Id, poll.Options.Count);
            return ToResponse(poll);
        }

        public async Task<PollResponseDto?> SetClosedAsync(int id, bool isClosed)
        {
            var poll = await WithOptions().FirstOrDefaultAsync(p => p.Id == id);
            // בעלות: אין לגעת בסקר שאינו בגן של המשתמש המחובר (IDOR)
            if (poll == null || !await _access.CanAccessGroupAsync(poll.GroupId))
            {
                return null;
            }
            if (!await _access.CanEditGroupAsync(poll.GroupId))
            {
                throw new ForbiddenException();
            }
            poll.IsClosed = isClosed;
            await _db.SaveChangesAsync();
            return ToResponse(poll);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var poll = await _db.Polls.FirstOrDefaultAsync(p => p.Id == id);
            if (poll == null || !await _access.CanAccessGroupAsync(poll.GroupId))
            {
                return false;
            }
            if (!await _access.CanEditGroupAsync(poll.GroupId))
            {
                throw new ForbiddenException();
            }
            // ההצבעות אינן ילדות של הסקר במודל (טבלה נפרדת) — מנקים אותן במפורש
            var votes = _db.PollVotes.Where(v => v.PollId == id);
            _db.PollVotes.RemoveRange(votes);
            _db.Polls.Remove(poll);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Poll deleted (Id: {PollId})", id);
            return true;
        }

        public async Task<PublicPollDto?> GetPublicAsync(string token)
        {
            var poll = await FindByTokenAsync(token);
            return poll == null ? null : ToPublic(poll);
        }

        public async Task<(PublicPollDto?, string?)> VoteAsync(string token, PollVoteDto dto)
        {
            var poll = await FindByTokenAsync(token);
            if (poll == null)
            {
                return (null, "הסקר לא נמצא. אפשר לבקש מהוועד קישור מעודכן.");
            }
            if (poll.IsClosed)
            {
                return (ToPublic(poll), "הסקר נסגר לתשובות. תודה!");
            }

            var option = poll.Options.FirstOrDefault(o => o.Id == dto.OptionId);
            if (option == null)
            {
                return (ToPublic(poll), "האפשרות שנבחרה אינה קיימת בסקר הזה.");
            }

            var voterKey = (dto.VoterKey ?? string.Empty).Trim();
            if (voterKey.Length == 0)
            {
                return (ToPublic(poll), "חסר מזהה מצביע.");
            }

            var alreadyVoted = await _db.PollVotes
                .AnyAsync(v => v.PollId == poll.Id && v.VoterKey == voterKey);
            if (alreadyVoted)
            {
                return (ToPublic(poll), "כבר הצבעתם בסקר הזה 🙂");
            }

            _db.PollVotes.Add(new PollVote
            {
                PollId = poll.Id,
                OptionId = option.Id,
                VoterKey = voterKey,
            });
            option.Votes += 1;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Poll vote recorded (PollId: {PollId})", poll.Id);
            return (ToPublic(poll), null);
        }

        private Task<Poll?> FindByTokenAsync(string token)
        {
            var clean = (token ?? string.Empty).Trim();
            if (clean.Length == 0)
            {
                return Task.FromResult<Poll?>(null);
            }
            return WithOptions().FirstOrDefaultAsync(p => p.PublicToken == clean);
        }

        private static PollResponseDto ToResponse(Poll poll) => new()
        {
            Id = poll.Id,
            Question = poll.Question,
            PublicToken = poll.PublicToken,
            IsClosed = poll.IsClosed,
            CreatedAt = poll.CreatedAt,
            TotalVotes = poll.Options.Sum(o => o.Votes),
            Options = poll.Options
                .Select(o => new PollOptionDto { Id = o.Id, Text = o.Text, Votes = o.Votes })
                .ToList(),
        };

        private static PublicPollDto ToPublic(Poll poll) => new()
        {
            Question = poll.Question,
            IsClosed = poll.IsClosed,
            TotalVotes = poll.Options.Sum(o => o.Votes),
            Options = poll.Options
                .Select(o => new PollOptionDto { Id = o.Id, Text = o.Text, Votes = o.Votes })
                .ToList(),
        };
    }
}
