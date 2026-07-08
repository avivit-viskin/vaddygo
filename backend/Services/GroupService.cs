using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      GroupService — הלוגיקה העסקית של הגדרת הגן מאשף ההרשמה:
      שמירת הגן עם קטגוריות הגבייה שלו, וחישוב יעד הגבייה בשרת
      (סה"כ לתלמיד × מספר ילדים). ניגש ל-DbContext ישירות (ולא דרך
      ה-Repository הגנרי) כי גן נטען תמיד יחד עם הקטגוריות שלו (Include).
    */
    public class GroupService : IGroupService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<GroupService> _logger;

        public GroupService(AppDbContext db, ILogger<GroupService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<List<GroupResponseDto>> GetAllAsync()
        {
            var groups = await _db.Groups.Include(g => g.Categories).ToListAsync();
            return groups.Select(ToResponse).ToList();
        }

        public async Task<GroupResponseDto?> GetByIdAsync(int id)
        {
            var group = await _db.Groups
                .Include(g => g.Categories)
                .FirstOrDefaultAsync(g => g.Id == id);
            return group == null ? null : ToResponse(group);
        }

        public async Task<GroupResponseDto> CreateAsync(GroupCreateDto dto)
        {
            var group = new Group
            {
                Name = dto.Name.Trim(),
                City = dto.City.Trim(),
                Year = dto.Year ?? SchoolYear.Current(),
                ChildrenCount = dto.ChildrenCount,
                StaffCount = dto.StaffCount,
                Subgroups = string.Join(",", dto.Subgroups.Select(s => s.Trim()).Where(s => s.Length > 0)),
                Categories = dto.Categories.Select(c => new CollectionCategory
                {
                    Name = c.Name.Trim(),
                    AmountPerChild = c.AmountPerChild,
                    Installments = c.Installments,
                }).ToList(),
            };

            _db.Groups.Add(group);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Group created (Id: {GroupId}, Categories: {CategoryCount})",
                group.Id, group.Categories.Count);
            return ToResponse(group);
        }

        private static GroupResponseDto ToResponse(Group group)
        {
            var totalPerChild = group.Categories.Sum(c => c.AmountPerChild);
            return new GroupResponseDto
            {
                Id = group.Id,
                Name = group.Name,
                City = group.City,
                Year = group.Year,
                ChildrenCount = group.ChildrenCount,
                StaffCount = group.StaffCount,
                Subgroups = group.Subgroups.Length == 0
                    ? new List<string>()
                    : group.Subgroups.Split(',').ToList(),
                Categories = group.Categories.Select(c => new CollectionCategoryResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    AmountPerChild = c.AmountPerChild,
                    Installments = c.Installments,
                }).ToList(),
                TotalPerChild = totalPerChild,
                CollectionGoal = totalPerChild * group.ChildrenCount,
            };
        }
    }
}
