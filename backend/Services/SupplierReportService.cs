using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      ISupplierReportService — הדוח שהספק רואה על עצמו.

      מופרד מ-VendorService במכוון: זה שירות **קריאה בלבד** שמצרף נתונים
      ממקורות שונים (צפיות, פניות, מוצרים, מיקום ברשימה), בעוד VendorService
      עוסק בניהול הכרטיס עצמו. ערבוב השניים היה מנפח קובץ שכבר גדול.
    */
    public interface ISupplierReportService
    {
        /* null אם הטוקן אינו תקף — הבקר מתרגם ל-404 בלי לרמוז שהספק קיים. */
        Task<SupplierReportDto?> GetByTokenAsync(string token, DateTime? from, DateTime? to);

        /* רושם צפייה ליום הנוכחי. נקרא מזרם הקטלוג הציבורי. */
        Task RecordViewAsync(int vendorId);
    }

    public class SupplierReportService : ISupplierReportService
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;
        private readonly ILogger<SupplierReportService> _logger;

        public SupplierReportService(
            AppDbContext db, IConfiguration config, ILogger<SupplierReportService> logger)
        {
            _db = db;
            _config = config;
            _logger = logger;
        }

        /* אותה מדיניות תוקף כמו בשאר מסכי הספק — טוקן שפג אינו פותח את הדוח. */
        private bool IsTokenValid(Vendor vendor) =>
            VendorTokenPolicy.IsValid(
                vendor,
                _config.GetValue("Vendors:EditTokenDays", VendorTokenPolicy.DefaultDays));

        public async Task RecordViewAsync(int vendorId)
        {
            var today = DateTime.UtcNow.Date;
            var row = await _db.VendorViewDays
                .FirstOrDefaultAsync(v => v.VendorId == vendorId && v.Day == today);

            if (row == null)
            {
                _db.VendorViewDays.Add(new VendorViewDay
                {
                    VendorId = vendorId,
                    Day = today,
                    Count = 1,
                });
            }
            else
            {
                row.Count += 1;
            }
            // השמירה נעשית אצל הקורא, יחד עם עדכון מונה הצפיות הכולל.
            await Task.CompletedTask;
        }

        public async Task<SupplierReportDto?> GetByTokenAsync(
            string token, DateTime? from, DateTime? to)
        {
            var vendor = await _db.Vendors
                .Include(v => v.Products)
                .FirstOrDefaultAsync(v => v.EditToken == token);

            if (vendor == null || !IsTokenValid(vendor))
            {
                return null;
            }

            /*
              נרמול הטווח: ברירת המחדל היא שנה אחורה — מספיק כדי לראות עונה
              שלמה. `to` נדחף לסוף היום, אחרת בחירת "עד היום" הייתה מחריגה את
              כל מה שקרה היום.
            */
            var rangeTo = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);
            var rangeFrom = (from ?? rangeTo.AddYears(-1)).Date;
            if (rangeFrom > rangeTo)
            {
                (rangeFrom, rangeTo) = (rangeTo.Date, rangeFrom.Date.AddDays(1).AddTicks(-1));
            }

            return new SupplierReportDto
            {
                From = rangeFrom,
                To = rangeTo,
                Views = await BuildViewsAsync(vendor, rangeFrom, rangeTo),
                Leads = await BuildLeadsAsync(vendor.Id, rangeFrom, rangeTo),
                Products = BuildProducts(vendor, rangeFrom, rangeTo),
                Placement = await BuildPlacementAsync(vendor),
                LastEditedAt = vendor.LastEditedAt,
            };
        }

        private async Task<SupplierViewsDto> BuildViewsAsync(
            Vendor vendor, DateTime from, DateTime to)
        {
            var days = await _db.VendorViewDays
                .Where(v => v.VendorId == vendor.Id)
                .ToListAsync();

            var trackedSince = days.Count == 0
                ? (DateTime?)null
                : days.Min(d => d.Day);

            return new SupplierViewsDto
            {
                Total = vendor.Views,
                InRange = days
                    .Where(d => d.Day >= from.Date && d.Day <= to.Date)
                    .Sum(d => d.Count),
                TrackedSince = trackedSince,
                // אם אין ספירה כלל, או שהטווח מתחיל לפניה — המספר בטווח חלקי,
                // והמסך חייב לומר זאת ולא להציג אותו כעובדה.
                RangeStartsBeforeTracking =
                    trackedSince == null || from.Date < trackedSince.Value.Date,
            };
        }

        private async Task<SupplierLeadsDto> BuildLeadsAsync(
            int vendorId, DateTime from, DateTime to)
        {
            var all = await _db.Leads
                .Where(l => l.VendorId == vendorId)
                .Select(l => new { l.Status, l.CreatedAt })
                .ToListAsync();

            var inRange = all.Where(l => l.CreatedAt >= from && l.CreatedAt <= to).ToList();

            return new SupplierLeadsDto
            {
                Total = all.Count,
                InRange = inRange.Count,
                ByStatus = inRange
                    .GroupBy(l => string.IsNullOrEmpty(l.Status) ? "new" : l.Status)
                    .ToDictionary(g => g.Key, g => g.Count()),
            };
        }

        private static SupplierProductsDto BuildProducts(
            Vendor vendor, DateTime from, DateTime to)
        {
            var products = vendor.Products ?? new List<VendorProduct>();
            var dated = products.Where(p => p.CreatedAt != null).ToList();

            return new SupplierProductsDto
            {
                Total = products.Count,
                LastAddedAt = dated.Count == 0 ? null : dated.Max(p => p.CreatedAt),
                AddedInRange = dated.Count(
                    p => p.CreatedAt >= from && p.CreatedAt <= to),
                WithoutDate = products.Count - dated.Count,
            };
        }

        /*
          המיקום ברשימה מחושב **באותו סדר שבו הרשימה מוצגת לוועד**: מקודמים
          תחילה ואז לפי שם. כל סדר אחר היה נותן לספק מספר שאינו תואם למה
          שרואים בפועל — כלומר מטעה, וגרוע מלא להציג כלום.
        */
        private async Task<SupplierPlacementDto> BuildPlacementAsync(Vendor vendor)
        {
            var placement = new SupplierPlacementDto
            {
                Area = vendor.City ?? string.Empty,
                Category = vendor.Category ?? string.Empty,
                Featured = vendor.Featured,
            };

            if (string.IsNullOrWhiteSpace(vendor.City))
            {
                // בלי עיר אין "אזור" להשוות אליו; מוחזר 0 והמסך מסביר מה לעשות.
                return placement;
            }

            var area = await _db.Vendors
                .Where(v => v.City == vendor.City)
                .Select(v => new { v.Id, v.Name, v.Featured, v.Category })
                .ToListAsync();

            var ordered = area
                .OrderByDescending(v => v.Featured)
                .ThenBy(v => v.Name, StringComparer.Ordinal)
                .ToList();

            placement.OutOf = ordered.Count;
            placement.Rank = ordered.FindIndex(v => v.Id == vendor.Id) + 1;

            if (!string.IsNullOrWhiteSpace(vendor.Category))
            {
                var sameCategory = ordered
                    .Where(v => v.Category == vendor.Category)
                    .ToList();
                placement.OutOfInCategory = sameCategory.Count;
                placement.RankInCategory = sameCategory.FindIndex(v => v.Id == vendor.Id) + 1;
            }

            return placement;
        }
    }
}
