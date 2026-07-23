using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      DashboardService — כל חישובי מסך הבית (UI_SPEC ס' 8) בשרת, לא בלקוח:
      יעד גבייה מהגדרת הגן, נגבה/חוב/יתרה, פירוקים, התראות וימי הולדת של הצוות.

      הנגבה בפועל ופירוק אמצעי התשלום יתמלאו כשמודל Payment ייבנה (שלב 5) —
      עד אז הם 0, והמבנה שהלקוח מקבל כבר סופי כך ששלב 5 לא ישבור אותו.
      ניגש ל-DbContext ישירות (כמו GroupService) כי הגן נטען עם הקטגוריות שלו.
    */
    public class DashboardService : IDashboardService
    {
        /* כמה ימים קדימה נחשב "יום הולדת קרוב" (התראה שבוע לפני, UI_SPEC ס' 9) */
        private const int BirthdayWindowDays = 30;
        private const int BirthdayAlertDays = 7;

        private readonly AppDbContext _db;
        private readonly IAccessScope _access;

        public DashboardService(AppDbContext db, IAccessScope access)
        {
            _db = db;
            _access = access;
        }

        public async Task<DashboardResponseDto?> GetSummaryAsync(int? groupId = null)
        {
            /* בעלות: הגן חייב להיות בבעלות המשתמש המחובר (מאומת מול ה-JWT). מזהה
               מוסד זר או חסר → הגן של המשתמש בלבד, לעולם לא של חשבון אחר. */
            var scoped = await _access.ScopeGroupIdAsync(groupId);
            if (scoped == null)
            {
                return null;
            }
            var group = await _db.Groups
                .Include(g => g.Categories)
                .FirstOrDefaultAsync(g => g.Id == scoped.Value);

            if (group == null)
            {
                return null;
            }

            /* סינון קפדני למוסד — כל מוסד רואה אך ורק את הצוות והתשלומים שלו.
               רשומות "יתומות" (GroupId==null) שויכו למוסד הראשי במיגרציית ה-Backfill. */
            var staff = await _db.StaffMembers.AsNoTracking()
                .Where(s => s.GroupId == group.Id)
                .ToListAsync();
            var paidPayments = await _db.Payments.AsNoTracking()
                .Include(p => p.Student)
                .Where(p => p.IsPaid && p.Student != null && p.Student.GroupId == group.Id)
                .ToListAsync();
            /* הוצאות הקופה של המוסד — מקטינות את היתרה ואת קוביות האמצעים */
            var expenses = await _db.Expenses.AsNoTracking()
                .Where(e => e.GroupId == group.Id)
                .ToListAsync();
            var today = DateTime.Today;

            var totalPerChild = group.Categories.Sum(c => c.AmountPerChild);
            var target = totalPerChild * group.ChildrenCount;

            /* הנגבה בפועל = סכום התשלומים שסומנו "שולם" (סכום כל האמצעים) */
            var collected = paidPayments.Sum(PaidTotal);
            /* חוב פתוח = כמה עוד צריך להיגבות מההורים (לא מושפע מהוצאות) */
            var openDebt = target - collected;
            /* יתרת הקופה = מה שיש בקופה בפועל = נגבה − הוצאות */
            var totalExpenses = expenses.Sum(e => e.Amount);
            var boxBalance = collected - totalExpenses;

            var birthdays = staff
                .Select(s => ToBirthday(s, today))
                .Where(b => (b.NextBirthday - today).TotalDays <= BirthdayWindowDays)
                .OrderBy(b => b.NextBirthday)
                .ToList();

            return new DashboardResponseDto
            {
                GanName = group.Name,
                /* גנים שנוצרו לפני שנוספה עמודת השנה (Year=0) מקבלים את השנה הנוכחית */
                Year = group.Year > 0 ? group.Year : SchoolYear.Current(),
                ChildrenCount = group.ChildrenCount,
                CollectionTarget = target,
                CollectedTotal = collected,
                OpenDebt = openDebt,
                BoxBalance = boxBalance,
                ProgressPercent = target == 0 ? 0 : (int)Math.Round(collected / target * 100),
                /* קוביות האמצעים = מה שנגבה בכל אמצעי פחות מה שיצא ממנו בהוצאות */
                ByPaymentMethod = new List<DashboardAmountDto>
                {
                    new() { Method = "bit", Amount = paidPayments.Sum(p => p.BitAmount) - MethodExpenses(expenses, "bit") },
                    new() { Method = "paybox", Amount = paidPayments.Sum(p => p.PayBoxAmount) - MethodExpenses(expenses, "paybox") },
                    new() { Method = "cash", Amount = paidPayments.Sum(p => p.CashAmount) - MethodExpenses(expenses, "cash") },
                    new() { Method = "card", Amount = paidPayments.Sum(p => p.CardAmount) - MethodExpenses(expenses, "card") },
                },
                ByCategory = group.Categories.Select(c => new DashboardCategoryDto
                {
                    Name = c.Name,
                    TargetAmount = c.AmountPerChild * group.ChildrenCount,
                    CollectedAmount = paidPayments
                        .Where(p => p.CollectionCategoryId == c.Id)
                        .Sum(PaidTotal),
                    /* מה שיצא מהקטגוריה = הוצאות שסווגו לשם הקטגוריה (למשל "ועד") */
                    SpentAmount = expenses
                        .Where(e => e.Category == c.Name)
                        .Sum(e => e.Amount),
                }).ToList(),
                Alerts = BuildAlerts(group, collected, birthdays, today),
                UpcomingBirthdays = birthdays,
            };
        }

        /* הסך ששולם ברשומת תשלום אחת = סכום כל האמצעים (כולל אשראי בסליקה) */
        private static decimal PaidTotal(Payment p) => p.BitAmount + p.PayBoxAmount + p.CashAmount + p.CardAmount;

        /* סך ההוצאות שיצאו מאמצעי מסוים (ביט/פייבוקס/מזומן) */
        private static decimal MethodExpenses(List<Expense> expenses, string method) =>
            expenses.Where(e => e.Method == method).Sum(e => e.Amount);

        private static List<DashboardAlertDto> BuildAlerts(
            Group group, decimal collected, List<DashboardBirthdayDto> birthdays, DateTime today)
        {
            var alerts = new List<DashboardAlertDto>();

            if (collected == 0 && group.ChildrenCount > 0)
            {
                alerts.Add(new DashboardAlertDto
                {
                    Type = "payments",
                    Message = $"הגבייה עוד לא התחילה — {group.ChildrenCount} ילדים טרם שילמו",
                });
            }

            foreach (var b in birthdays.Where(b => (b.NextBirthday - today).TotalDays <= BirthdayAlertDays))
            {
                alerts.Add(new DashboardAlertDto
                {
                    Type = "birthday",
                    Message = b.NextBirthday == today
                        ? $"יום הולדת של {b.FullName} היום! 🎂"
                        : $"יום הולדת של {b.FullName} ב-{b.NextBirthday:dd.MM}",
                });
            }

            return alerts;
        }

        /* מחשב מתי יחול יום ההולדת הבא (מטפל גם ב-29.2 בשנה לא מעוברת) */
        private static DashboardBirthdayDto ToBirthday(StaffMember member, DateTime today)
        {
            var day = Math.Min(member.BirthDate.Day, DateTime.DaysInMonth(today.Year, member.BirthDate.Month));
            var next = new DateTime(today.Year, member.BirthDate.Month, day);
            if (next < today)
            {
                day = Math.Min(member.BirthDate.Day, DateTime.DaysInMonth(today.Year + 1, member.BirthDate.Month));
                next = new DateTime(today.Year + 1, member.BirthDate.Month, day);
            }

            return new DashboardBirthdayDto
            {
                StaffMemberId = member.Id,
                FullName = member.FullName,
                Role = member.Role,
                BirthDate = member.BirthDate,
                NextBirthday = next,
            };
        }
    }
}
