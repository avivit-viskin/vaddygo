using Microsoft.EntityFrameworkCore;

namespace ParentCommitteeAPI.Services
{
    /*
      ProActivationService — הפעלת מסלול פרו אוטומטית אחרי תשלום (webhook מ-GROW).
      מזהה את היעד לפי שדה-מזהה מפורש (groupId/vendorId שהעברנו בקישור התשלום) או,
      כגיבוי, לפי מייל המשלם. פותח פרו עם תוקף שנה. מפריד מ-SetPro הידני של המנהלת
      (שנשאר בלי תפוגה), כדי שרכישה אוטומטית תיתן תוקף שנתי כמו מנוי בתשלום.
    */
    public interface IProActivationService
    {
        /* פרו לוועד — לפי groupId מפורש, ואם אין, לפי המייל של בעל/ת החשבון. */
        Task<bool> ActivateCommitteeAsync(int? groupId, string? email, DateTime validUntil);

        /* פרו לספק — לפי vendorId מפורש, ואם אין, לפי מייל ההתחברות של הספק. */
        Task<bool> ActivateSupplierAsync(int? vendorId, string? email, DateTime validUntil);
    }

    public class ProActivationService : IProActivationService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<ProActivationService> _logger;

        public ProActivationService(AppDbContext db, ILogger<ProActivationService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<bool> ActivateCommitteeAsync(int? groupId, string? email, DateTime validUntil)
        {
            List<Models.Group> groups;
            if (groupId is int gid)
            {
                var g = await _db.Groups.FirstOrDefaultAsync(x => x.Id == gid);
                groups = g == null ? new() : new() { g };
            }
            else
            {
                var e = (email ?? string.Empty).Trim().ToLowerInvariant();
                if (e.Length == 0)
                {
                    groups = new();
                }
                else
                {
                    var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == e);
                    groups = user == null
                        ? new()
                        : await _db.Groups.Where(x => x.UserId == user.Id).ToListAsync();
                }
            }

            if (groups.Count == 0)
            {
                _logger.LogWarning(
                    "Pro activation (committee) — no group matched (groupId: {GroupId}, email: {Email})",
                    groupId, email);
                return false;
            }

            foreach (var g in groups)
            {
                g.IsPro = true;
                g.ProValidUntil = validUntil;
            }
            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "Pro activated for {Count} committee group(s) until {Until} (groupId: {GroupId}, email: {Email})",
                groups.Count, validUntil, groupId, email);
            return true;
        }

        public async Task<bool> ActivateSupplierAsync(int? vendorId, string? email, DateTime validUntil)
        {
            Models.Vendor? vendor = null;
            if (vendorId is int vid)
            {
                vendor = await _db.Vendors.FirstOrDefaultAsync(x => x.Id == vid);
            }
            else
            {
                var e = (email ?? string.Empty).Trim().ToLowerInvariant();
                if (e.Length > 0)
                {
                    vendor = await _db.Vendors.FirstOrDefaultAsync(x => x.LoginEmail == e);
                }
            }

            if (vendor == null)
            {
                _logger.LogWarning(
                    "Pro activation (supplier) — no vendor matched (vendorId: {VendorId}, email: {Email})",
                    vendorId, email);
                return false;
            }

            vendor.IsPro = true;
            vendor.ProValidUntil = validUntil;
            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "Pro activated for supplier {VendorId} until {Until}", vendor.Id, validUntil);
            return true;
        }
    }
}
