using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.Auth;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      VendorService — הלוגיקה העסקית של הספקים. ניגש ל-DbContext ישירות (ולא
      דרך ה-Repository הגנרי) כי ספק נטען תמיד יחד עם המוצרים שלו (Include),
      כמו GroupService עם הקטגוריות שלו.
    */
    public class VendorService : IVendorService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<VendorService> _logger;

        public VendorService(AppDbContext db, ILogger<VendorService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<List<VendorResponseDto>> GetAllAsync()
        {
            var vendors = await WithChildren(_db.Vendors).ToListAsync();
            return vendors.Select(ToResponse).ToList();
        }

        public async Task<VendorResponseDto?> GetByIdAsync(int id)
        {
            var vendor = await WithChildren(_db.Vendors).FirstOrDefaultAsync(v => v.Id == id);
            return vendor == null ? null : ToResponse(vendor);
        }

        public async Task<VendorResponseDto> CreateAsync(VendorCreateDto dto)
        {
            var vendor = new Vendor
            {
                Name = dto.Name.Trim(),
                CatalogUrl = dto.CatalogUrl.Trim(),
                WhatsApp = dto.WhatsApp.Trim(),
                Category = dto.Category.Trim(),
                City = dto.City.Trim(),
                Products = MapProducts(dto.Products),
                SocialLinks = MapSocialLinks(dto.SocialLinks),
            };

            _db.Vendors.Add(vendor);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor created (Id: {VendorId}, Products: {Count})",
                vendor.Id, vendor.Products.Count);
            return ToResponse(vendor);
        }

        public async Task<VendorResponseDto?> UpdateAsync(int id, VendorUpdateDto dto)
        {
            var vendor = await WithChildren(_db.Vendors).FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null)
            {
                return null;
            }

            ApplyWrite(vendor, dto);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor updated (Id: {VendorId})", id);
            return ToResponse(vendor);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var vendor = await WithChildren(_db.Vendors).FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null)
            {
                return false;
            }

            _db.Vendors.Remove(vendor);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor deleted (Id: {VendorId})", id);
            return true;
        }

        public async Task<string?> GenerateEditTokenAsync(int id)
        {
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null)
            {
                return null;
            }
            // מייצרים טוקן פעם אחת ומחזירים אותו יציב — כדי שהקישור לא ישתנה בכל בקשה
            if (string.IsNullOrEmpty(vendor.EditToken))
            {
                vendor.EditToken = Guid.NewGuid().ToString("N");
                await _db.SaveChangesAsync();
                _logger.LogInformation("Vendor edit link generated (Id: {VendorId})", id);
            }
            return vendor.EditToken;
        }

        public async Task<VendorResponseDto?> GetByEditTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return null;
            }
            var vendor = await WithChildren(_db.Vendors)
                .FirstOrDefaultAsync(v => v.EditToken == token);
            return vendor == null ? null : ToResponse(vendor);
        }

        public async Task<VendorResponseDto?> UpdateByEditTokenAsync(string token, VendorUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return null;
            }
            var vendor = await WithChildren(_db.Vendors)
                .FirstOrDefaultAsync(v => v.EditToken == token);
            if (vendor == null)
            {
                return null;
            }
            ApplyWrite(vendor, dto);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor self-updated via edit token (Id: {VendorId})", vendor.Id);
            return ToResponse(vendor);
        }

        public async Task<CredentialResult> SetCredentialsAsync(
            string token, string loginEmail, string password)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return CredentialResult.NotFound;
            }
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.EditToken == token);
            if (vendor == null)
            {
                return CredentialResult.NotFound;
            }
            var email = (loginEmail ?? string.Empty).Trim().ToLowerInvariant();
            if (email.Length == 0 || (password ?? string.Empty).Length < 6)
            {
                return CredentialResult.Invalid;
            }
            // המייל הוא מזהה ההתחברות — חייב להיות ייחודי בין הספקים
            var taken = await _db.Vendors.AnyAsync(
                v => v.Id != vendor.Id && v.LoginEmail == email);
            if (taken)
            {
                return CredentialResult.EmailTaken;
            }
            vendor.LoginEmail = email;
            vendor.PasswordHash = PasswordHasher.Hash(password);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor credentials set (Id: {VendorId})", vendor.Id);
            return CredentialResult.Ok;
        }

        public async Task<string?> LoginAsync(string loginEmail, string password)
        {
            var email = (loginEmail ?? string.Empty).Trim().ToLowerInvariant();
            if (email.Length == 0 || string.IsNullOrEmpty(password))
            {
                return null;
            }
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.LoginEmail == email);
            if (vendor == null || string.IsNullOrEmpty(vendor.PasswordHash))
            {
                return null;
            }
            if (!PasswordHasher.Verify(password, vendor.PasswordHash))
            {
                return null;
            }
            // אמור להיות טוקן; ליתר ביטחון מייצרים אם חסר
            if (string.IsNullOrEmpty(vendor.EditToken))
            {
                vendor.EditToken = Guid.NewGuid().ToString("N");
                await _db.SaveChangesAsync();
            }
            return vendor.EditToken;
        }

        /* החלת שדות הכתיבה על ספק — משותף לעריכת המנהל ולעריכה העצמית בטוקן.
           רשימות הבנים (מוצרים/רשתות) מוחלפות כולן — פשוט ותואם לטופס. */
        private void ApplyWrite(Vendor vendor, VendorWriteDto dto)
        {
            vendor.Name = dto.Name.Trim();
            vendor.CatalogUrl = dto.CatalogUrl.Trim();
            vendor.WhatsApp = dto.WhatsApp.Trim();
            vendor.Category = dto.Category.Trim();
            vendor.City = dto.City.Trim();
            _db.VendorProducts.RemoveRange(vendor.Products);
            _db.VendorSocialLinks.RemoveRange(vendor.SocialLinks);
            vendor.Products = MapProducts(dto.Products);
            vendor.SocialLinks = MapSocialLinks(dto.SocialLinks);
        }

        /* ספק נטען תמיד עם המוצרים והקישורים החברתיים שלו */
        private static IQueryable<Vendor> WithChildren(IQueryable<Vendor> query) =>
            query.Include(v => v.Products).Include(v => v.SocialLinks);

        private static List<VendorProduct> MapProducts(List<VendorProductDto> products) =>
            products
                .Where(p => !string.IsNullOrWhiteSpace(p.Name))
                .Select(p => new VendorProduct
                {
                    Name = p.Name.Trim(),
                    Price = p.Price,
                    ImageUrl = p.ImageUrl.Trim(),
                    Folder = (p.Folder ?? string.Empty).Trim(),
                })
                .ToList();

        private static List<VendorSocialLink> MapSocialLinks(List<VendorSocialLinkDto> links) =>
            links
                .Where(l => !string.IsNullOrWhiteSpace(l.Url))
                .Select(l => new VendorSocialLink
                {
                    Label = l.Label.Trim(),
                    Url = l.Url.Trim(),
                })
                .ToList();

        private static VendorResponseDto ToResponse(Vendor vendor) => new()
        {
            Id = vendor.Id,
            Name = vendor.Name,
            CatalogUrl = vendor.CatalogUrl,
            WhatsApp = vendor.WhatsApp,
            Category = vendor.Category,
            City = vendor.City,
            Products = vendor.Products.Select(p => new VendorProductResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                ImageUrl = p.ImageUrl,
                Folder = p.Folder,
            }).ToList(),
            SocialLinks = vendor.SocialLinks.Select(l => new VendorSocialLinkResponseDto
            {
                Id = l.Id,
                Label = l.Label,
                Url = l.Url,
            }).ToList(),
        };
    }
}
