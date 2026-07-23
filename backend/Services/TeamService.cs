using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      TeamService — ניהול חברי הצוות וההזמנות של הגן, עם אכיפת הרשאות בשרת:
      רק "מנהל" (הבעלים או חבר בהרשאת manager) יכול להזמין/להסיר/לשנות הרשאות.
      ההזמנה נעשית דרך טוקן אקראי בקישור; המוזמן, לאחר התחברות, פודה את הטוקן
      ומצטרף כ-GroupMember עם ההרשאה שבהזמנה.
    */
    public class TeamService : ITeamService
    {
        private static readonly HashSet<string> Roles = new() { "viewer", "editor", "manager" };

        private readonly AppDbContext _db;
        private readonly IAccessScope _access;
        private readonly ILogger<TeamService> _logger;

        public TeamService(AppDbContext db, IAccessScope access, ILogger<TeamService> logger)
        {
            _db = db;
            _access = access;
            _logger = logger;
        }

        public async Task<TeamResponseDto?> GetTeamAsync(int? activeGroupId)
        {
            var scoped = await _access.ScopeGroupIdAsync(activeGroupId);
            if (scoped == null)
            {
                return null;
            }

            var gid = scoped.Value;

            // חברי הצוות (עם שם המשתמש) — כטאפלים לגישה נוחה
            var members = (await _db.GroupMembers
                .Where(m => m.GroupId == gid)
                .Join(_db.Users, m => m.UserId, u => u.Id,
                    (m, u) => new { m.Id, m.UserId, u.Username, m.Role })
                .ToListAsync())
                .Select(x => (x.Id, x.UserId, x.Username, x.Role))
                .ToList();
            var memberByUser = members.ToDictionary(m => m.UserId);

            // כל ההזמנות — ממתינות ראשונות, ואז שנוצלו
            var invites = await _db.GroupInvites
                .Where(i => i.GroupId == gid)
                .OrderBy(i => i.Used)
                .ThenByDescending(i => i.Id)
                .ToListAsync();

            // רשימת "גישות" מאוחדת
            var accesses = new List<AccessDto>();
            var linkedMemberIds = new HashSet<int>();
            foreach (var inv in invites)
            {
                if (!inv.Used)
                {
                    accesses.Add(new AccessDto
                    {
                        Name = string.IsNullOrWhiteSpace(inv.InviteeName) ? "משתמש שהוזמן" : inv.InviteeName,
                        Role = inv.Role,
                        Approved = false,
                        InviteId = inv.Id,
                        Token = inv.Token,
                    });
                    continue;
                }
                // הזמנה שנוצלה — מקשרים לחבר הצוות (אם קיים קישור)
                if (inv.AcceptedByUserId != null)
                {
                    if (!memberByUser.TryGetValue(inv.AcceptedByUserId.Value, out var mem))
                    {
                        continue; // החבר הוסר — לא מציגים את ההזמנה שנוצלה
                    }
                    accesses.Add(new AccessDto
                    {
                        Name = string.IsNullOrWhiteSpace(inv.InviteeName) ? mem.Username : inv.InviteeName,
                        Role = mem.Role,
                        Approved = true,
                        MemberId = mem.Id,
                    });
                    linkedMemberIds.Add(mem.Id);
                }
                else
                {
                    // נוצלה ללא קישור (נתונים ישנים) — מציגים לפי ההזמנה
                    accesses.Add(new AccessDto
                    {
                        Name = string.IsNullOrWhiteSpace(inv.InviteeName) ? "משתמש" : inv.InviteeName,
                        Role = inv.Role,
                        Approved = true,
                    });
                }
            }

            // חברים ללא הזמנה מקושרת (הצטרפו לפני המנגנון) — מוסיפים בסוף
            foreach (var mem in members)
            {
                if (!linkedMemberIds.Contains(mem.Id))
                {
                    accesses.Add(new AccessDto
                    {
                        Name = mem.Username,
                        Role = mem.Role,
                        Approved = true,
                        MemberId = mem.Id,
                    });
                }
            }

            return new TeamResponseDto
            {
                Accesses = accesses,
                CanManage = await _access.CanManageGroupAsync(scoped),
            };
        }

        public async Task<InviteResponseDto?> CreateInviteAsync(int? activeGroupId, InviteCreateDto dto)
        {
            var scoped = await _access.ScopeGroupIdAsync(activeGroupId);
            if (scoped == null)
            {
                return null;
            }
            if (!await _access.CanManageGroupAsync(scoped))
            {
                throw new ForbiddenException("רק מנהל יכול להזמין משתמשים");
            }

            var invite = new GroupInvite
            {
                GroupId = scoped.Value,
                Token = Guid.NewGuid().ToString("N"),
                Role = Roles.Contains(dto.Role) ? dto.Role : "viewer",
                InviteeName = (dto.Name ?? string.Empty).Trim(),
                CreatedAt = DateTime.UtcNow,
            };
            _db.GroupInvites.Add(invite);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Invite created (Group: {GroupId}, Role: {Role})", scoped, invite.Role);

            return new InviteResponseDto
            {
                Id = invite.Id,
                Token = invite.Token,
                Role = invite.Role,
                InviteeName = invite.InviteeName,
            };
        }

        public async Task<bool> CancelInviteAsync(int? activeGroupId, int inviteId)
        {
            var scoped = await _access.ScopeGroupIdAsync(activeGroupId);
            if (scoped == null)
            {
                return false;
            }
            if (!await _access.CanManageGroupAsync(scoped))
            {
                throw new ForbiddenException("רק מנהל יכול לבטל הזמנות");
            }

            var invite = await _db.GroupInvites
                .FirstOrDefaultAsync(i => i.Id == inviteId && i.GroupId == scoped.Value);
            if (invite == null)
            {
                return false;
            }
            _db.GroupInvites.Remove(invite);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveMemberAsync(int? activeGroupId, int memberId)
        {
            var scoped = await _access.ScopeGroupIdAsync(activeGroupId);
            if (scoped == null)
            {
                return false;
            }
            if (!await _access.CanManageGroupAsync(scoped))
            {
                throw new ForbiddenException("רק מנהל יכול להסיר משתמשים");
            }

            var member = await _db.GroupMembers
                .FirstOrDefaultAsync(m => m.Id == memberId && m.GroupId == scoped.Value);
            if (member == null)
            {
                return false;
            }
            _db.GroupMembers.Remove(member);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateMemberRoleAsync(int? activeGroupId, int memberId, string role)
        {
            var scoped = await _access.ScopeGroupIdAsync(activeGroupId);
            if (scoped == null || !Roles.Contains(role))
            {
                return false;
            }
            if (!await _access.CanManageGroupAsync(scoped))
            {
                throw new ForbiddenException("רק מנהל יכול לשנות הרשאות");
            }

            var member = await _db.GroupMembers
                .FirstOrDefaultAsync(m => m.Id == memberId && m.GroupId == scoped.Value);
            if (member == null)
            {
                return false;
            }
            member.Role = role;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<InvitePreviewDto?> PreviewInviteAsync(string token)
        {
            var invite = await _db.GroupInvites.FirstOrDefaultAsync(i => i.Token == token);
            if (invite == null)
            {
                return null;
            }
            var ganName = await _db.Groups
                .Where(g => g.Id == invite.GroupId)
                .Select(g => g.Name)
                .FirstOrDefaultAsync();
            var uid = _access.UserId;
            var already = uid != null && (
                await _db.Groups.AnyAsync(g => g.Id == invite.GroupId && g.UserId == uid.Value) ||
                await _db.GroupMembers.AnyAsync(m => m.GroupId == invite.GroupId && m.UserId == uid.Value));

            return new InvitePreviewDto
            {
                GanId = invite.GroupId,
                GanName = ganName ?? string.Empty,
                Role = invite.Role,
                AlreadyMember = already,
                // נוצלה על ידי מישהו אחר, ואני לא חבר/בעלים → לא ניתן להצטרף איתה
                Used = invite.Used && !already,
            };
        }

        public async Task<InvitePreviewDto?> AcceptInviteAsync(string token)
        {
            var uid = _access.UserId;
            if (uid == null)
            {
                return null;
            }
            var invite = await _db.GroupInvites.FirstOrDefaultAsync(i => i.Token == token);
            if (invite == null)
            {
                return null;
            }

            var isOwner = await _db.Groups.AnyAsync(g => g.Id == invite.GroupId && g.UserId == uid.Value);
            var existing = await _db.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == invite.GroupId && m.UserId == uid.Value);

            // בעלים או חבר קיים שפותח את הקישור — כבר יש לו גישה, רק "נכנס" (בלי שינוי).
            // כך גם הבעלים שבודק את הקישור וגם המוזמן שכבר הצטרף יכולים לפתוח אותו שוב.
            if (!isOwner && existing == null)
            {
                if (invite.Used)
                {
                    // ההזמנה כבר נוצלה על ידי מישהו אחר — משתמש חדש אינו יכול להצטרף איתה
                    return null;
                }
                _db.GroupMembers.Add(new GroupMember
                {
                    GroupId = invite.GroupId,
                    UserId = uid.Value,
                    Role = invite.Role,
                    JoinedAt = DateTime.UtcNow,
                });
                // מסמנים "נוצלה" (לא מוחקים) ומקשרים למי שהצטרף — לרשימת ה"גישות"
                invite.Used = true;
                invite.AcceptedByUserId = uid.Value;
                await _db.SaveChangesAsync();
            }
            else if (!isOwner && existing != null && !invite.Used)
            {
                existing.Role = invite.Role; // הוזמן מחדש עם הרשאה חדשה
                invite.Used = true;
                invite.AcceptedByUserId = uid.Value;
                await _db.SaveChangesAsync();
            }
            _logger.LogInformation("Invite accepted (Group: {GroupId}, User: {UserId})", invite.GroupId, uid);

            var ganName = await _db.Groups
                .Where(g => g.Id == invite.GroupId)
                .Select(g => g.Name)
                .FirstOrDefaultAsync();
            return new InvitePreviewDto
            {
                GanId = invite.GroupId,
                GanName = ganName ?? string.Empty,
                Role = invite.Role,
                AlreadyMember = true,
            };
        }
    }
}
