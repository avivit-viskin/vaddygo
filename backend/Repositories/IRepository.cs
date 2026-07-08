namespace ParentCommitteeAPI.Repositories
{
    /*
      IRepository<T> — החוזה הגנרי של שכבת הנתונים (DAL).
      כל ישות חדשה (Student, Event, Payment...) מקבלת Repository מוכן
      בלי לכתוב קוד גישה למסד מחדש.
    */
    public interface IRepository<T> where T : class
    {
        Task<List<T>> GetAllAsync();
        Task<T?> GetByIdAsync(int id);
        Task<T> AddAsync(T entity);
        Task UpdateAsync(T entity);
        Task DeleteAsync(T entity);
    }
}
