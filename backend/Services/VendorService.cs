using Microsoft.EntityFrameworkCore;
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

            vendor.Name = dto.Name.Trim();
            vendor.CatalogUrl = dto.CatalogUrl.Trim();
            vendor.WhatsApp = dto.WhatsApp.Trim();
            // מחליפים את רשימות הבנים כולן — פשוט ותואם לעריכה בטופס הלקוח
            _db.VendorProducts.RemoveRange(vendor.Products);
            _db.VendorSocialLinks.RemoveRange(vendor.SocialLinks);
            vendor.Products = MapProducts(dto.Products);
            vendor.SocialLinks = MapSocialLinks(dto.SocialLinks);

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
            Products = vendor.Products.Select(p => new VendorProductResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                ImageUrl = p.ImageUrl,
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
