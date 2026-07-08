using Microsoft.EntityFrameworkCore;

namespace ParentCommitteeAPI.Repositories
{
    /*
      Repository<T> — מימוש גנרי יחיד של IRepository מעל EF Core.
      גישה לנתונים בלבד — לוגיקה עסקית שייכת ל-Services.
    */
    public class Repository<T> : IRepository<T> where T : class
    {
        private readonly AppDbContext _context;
        private readonly DbSet<T> _set;

        public Repository(AppDbContext context)
        {
            _context = context;
            _set = context.Set<T>();
        }

        public Task<List<T>> GetAllAsync() => _set.AsNoTracking().ToListAsync();

        public async Task<T?> GetByIdAsync(int id) => await _set.FindAsync(id);

        public async Task<T> AddAsync(T entity)
        {
            _set.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task UpdateAsync(T entity)
        {
            _set.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(T entity)
        {
            _set.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }
}
