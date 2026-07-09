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
            var vendors = await _db.Vendors.Include(v => v.Products).ToListAsync();
            return vendors.Select(ToResponse).ToList();
        }

        public async Task<VendorResponseDto?> GetByIdAsync(int id)
        {
            var vendor = await _db.Vendors
                .Include(v => v.Products)
                .FirstOrDefaultAsync(v => v.Id == id);
            return vendor == null ? null : ToResponse(vendor);
        }

        public async Task<VendorResponseDto> CreateAsync(VendorCreateDto dto)
        {
            var vendor = new Vendor
            {
                Name = dto.Name.Trim(),
                CatalogUrl = dto.CatalogUrl.Trim(),
                Products = MapProducts(dto.Products),
            };

            _db.Vendors.Add(vendor);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor created (Id: {VendorId}, Products: {Count})",
                vendor.Id, vendor.Products.Count);
            return ToResponse(vendor);
        }

        public async Task<VendorResponseDto?> UpdateAsync(int id, VendorUpdateDto dto)
        {
            var vendor = await _db.Vendors
                .Include(v => v.Products)
                .FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null)
            {
                return null;
            }

            vendor.Name = dto.Name.Trim();
            vendor.CatalogUrl = dto.CatalogUrl.Trim();
            // מחליפים את רשימת המוצרים כולה — פשוט ותואם לעריכה בטופס הלקוח
            _db.VendorProducts.RemoveRange(vendor.Products);
            vendor.Products = MapProducts(dto.Products);

            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor updated (Id: {VendorId})", id);
            return ToResponse(vendor);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var vendor = await _db.Vendors
                .Include(v => v.Products)
                .FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null)
            {
                return false;
            }

            _db.Vendors.Remove(vendor);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Vendor deleted (Id: {VendorId})", id);
            return true;
        }

        private static List<VendorProduct> MapProducts(List<VendorProductDto> products) =>
            products
                .Where(p => !string.IsNullOrWhiteSpace(p.Name))
                .Select(p => new VendorProduct
                {
                    Name = p.Name.Trim(),
                    Price = p.Price,
                })
                .ToList();

        private static VendorResponseDto ToResponse(Vendor vendor) => new()
        {
            Id = vendor.Id,
            Name = vendor.Name,
            CatalogUrl = vendor.CatalogUrl,
            Products = vendor.Products.Select(p => new VendorProductResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
            }).ToList(),
        };
    }
}
