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

        public async Task<int?> ScopeGroupIdAsync(int? requestedGroupId)
        {
            var owned = await OwnedGroupIdsAsync();
            if (owned.Count == 0)
            {
                return null;
            }
            // מוסד שהתבקש ובבעלות המשתמש → אותו מוסד. אחרת (לא התבקש, או
            // X-Institution ישן/שגוי שאינו שלו) → הגן הראשון *שלו*, לא null —
            // כדי שרשומות חדשות לא ייווצרו יתומות ויעלמו. תמיד נתוני המשתמש עצמו.
            if (requestedGroupId.HasValue && owned.Contains(requestedGroupId.Value))
            {
                return requestedGroupId;
            }
            return owned[0];
        }

        public async Task<bool> CanAccessGroupAsync(int? groupId)
        {
            if (groupId == null)
            {
                return false;
            }
            var owned = await OwnedGroupIdsAsync();
            return owned.Contains(groupId.Value);
        }
    }
}
