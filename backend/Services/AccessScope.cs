using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace ParentCommitteeAPI.Services
{
    /*
      IAccessScope — שכבת בקרת הגישה (Authorization) של המערכת.
      מקור האמת ל"מה מותר למשתמש לראות" הוא ה-JWT של המשתמש המחובר בלבד —
      לעולם לא ערך שהלקוח שולח (X-Institution הוא רק *העדפת תצוגה*, ותמיד
      מאומת מול הגנים שבבעלות המשתמש).

      עקרון בטיחות: היעדר שיוך/בעלות = **אין גישה**, לא "גישה להכל".
      פירוט מלא: SECURITY_REMEDIATION.md.
    */
    public interface IAccessScope
    {
        /* מזהה המשתמש המחובר (מ-claim ה-sub של ה-JWT); null אם אין. */
        int? UserId { get; }

        /* מזהי הגנים שבבעלות המשתמש המחובר. */
        Task<IReadOnlyList<int>> OwnedGroupIdsAsync();

        /* כל הגנים שהמשתמש רשאי לגשת אליהם: בבעלותו + כאלה שהוזמן אליהם (חבר). */
        Task<IReadOnlyList<int>> AccessibleGroupIdsAsync();

        /* ההרשאה של המשתמש בגן: "manager" (בעלים/מנהל) | "editor" | "viewer" | null. */
        Task<string?> GetRoleAsync(int? groupId);

        /* האם המשתמש רשאי *לערוך* בגן — בעלים/מנהל/עורך (לא צופה). */
        Task<bool> CanEditGroupAsync(int? groupId);

        /* האם המשתמש רשאי *לנהל* את הגן (הזמנה/הסרת חברים) — בעלים או מנהל. */
        Task<bool> CanManageGroupAsync(int? groupId);

        /*
          מחזיר את מזהה הגן שאליו יש לסנן רשימה:
          - אם הלקוח ביקש מוסד (X-Institution) והוא בבעלות המשתמש → אותו מזהה.
          - אם ביקש מוסד שאינו שלו (זיוף/מזהה ישן בדפדפן) → הגן הראשון *שלו*.
            X-Institution הוא "העדפת תצוגה" בלבד; כשהיא שגויה נופלים חזרה לגן
            של המשתמש עצמו — לעולם לא של אחר, ולכן בטוח. כך רשומה חדשה לא
            נשמרת "יתומה" (GroupId=null) ונעלמת כשה-X-Institution לא תואם.
          - אם לא ביקש כלום → הגן הראשון של המשתמש (הנתונים שלו בלבד).
          - אם למשתמש אין גנים כלל → null (אין גישה).
          חשוב: null אף פעם לא אומר "בלי סינון = הכל".
        */
        Task<int?> ScopeGroupIdAsync(int? requestedGroupId);

        /* האם הגן הנתון שייך למשתמש המחובר (לבדיקות בעלות על משאב לפי id / IDOR). */
        Task<bool> CanAccessGroupAsync(int? groupId);
    }

    public class AccessScope : IAccessScope
    {
        private readonly AppDbContext _db;
        private readonly IHttpContextAccessor _http;
        private IReadOnlyList<int>? _ownedCache;
        private Dictionary<int, string>? _memberRolesCache;

        public AccessScope(AppDbContext db, IHttpContextAccessor http)
        {
            _db = db;
            _http = http;
        }

        public int? UserId
        {
            get
            {
                var user = _http.HttpContext?.User;
                if (user == null)
                {
                    return null;
                }
                // כברירת מחדל JwtBearer ממפה את sub ל-NameIdentifier; בודקים גם את השם הגולמי.
                var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                          ?? user.FindFirst("sub")?.Value;
                return int.TryParse(sub, out var id) ? id : (int?)null;
            }
        }

        public async Task<IReadOnlyList<int>> OwnedGroupIdsAsync()
        {
            if (_ownedCache != null)
            {
                return _ownedCache;
            }
            var uid = UserId;
            _ownedCache = uid == null
                ? new List<int>()
                : await _db.Groups.Where(g => g.UserId == uid.Value).Select(g => g.Id).ToListAsync();
            return _ownedCache;
        }

        /* מיפוי גן→הרשאה עבור הגנים שאליהם המשתמש *הוזמן* (חבר, לא בעלים). */
        private async Task<Dictionary<int, string>> MemberRolesAsync()
        {
            if (_memberRolesCache != null)
            {
                return _memberRolesCache;
            }
            var uid = UserId;
            _memberRolesCache = uid == null
                ? new Dictionary<int, string>()
                : await _db.GroupMembers
                    .Where(m => m.UserId == uid.Value)
                    .ToDictionaryAsync(m => m.GroupId, m => m.Role);
            return _memberRolesCache;
        }

        public async Task<IReadOnlyList<int>> AccessibleGroupIdsAsync()
        {
            var owned = await OwnedGroupIdsAsync();
            var member = await MemberRolesAsync();
            // בעלות קודם — כדי שברירת המחדל (הגן הראשון) תהיה הגן של המשתמש עצמו
            return owned.Concat(member.Keys.Where(id => !owned.Contains(id))).ToList();
        }

        public async Task<int?> ScopeGroupIdAsync(int? requestedGroupId)
        {
            var accessible = await AccessibleGroupIdsAsync();
            if (accessible.Count == 0)
            {
                return null;
            }
            // מוסד שהתבקש ושהמשתמש רשאי לגשת אליו (בעלות/חברוּת) → אותו מוסד.
            // אחרת (לא התבקש, או X-Institution ישן/שגוי) → הגן הראשון הנגיש *שלו*,
            // לעולם לא של משתמש אחר.
            if (requestedGroupId.HasValue && accessible.Contains(requestedGroupId.Value))
            {
                return requestedGroupId;
            }
            return accessible[0];
        }

        public async Task<bool> CanAccessGroupAsync(int? groupId)
        {
            if (groupId == null)
            {
                return false;
            }
            var accessible = await AccessibleGroupIdsAsync();
            return accessible.Contains(groupId.Value);
        }

        public async Task<string?> GetRoleAsync(int? groupId)
        {
            if (groupId == null)
            {
                return null;
            }
            var owned = await OwnedGroupIdsAsync();
            if (owned.Contains(groupId.Value))
            {
                return "manager"; // הבעלים = מנהל מלא
            }
            var roles = await MemberRolesAsync();
            return roles.TryGetValue(groupId.Value, out var role) ? role : null;
        }

        public async Task<bool> CanEditGroupAsync(int? groupId)
        {
            var role = await GetRoleAsync(groupId);
            return role == "manager" || role == "editor";
        }

        public async Task<bool> CanManageGroupAsync(int? groupId)
        {
            var role = await GetRoleAsync(groupId);
            return role == "manager";
        }
    }
}
