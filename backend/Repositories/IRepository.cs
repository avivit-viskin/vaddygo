using System.Linq.Expressions;

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

        /*
          שליפה מסוננת — הסינון מתבצע **במסד**, לא בזיכרון.

          🔴 למה זה נוסף: עד 02.09.2026 שירותים קראו GetAllAsync() וסיננו אחר כך
          ב-C#. כלומר כל פתיחה של מסך טענה את כל השורות של **כל המוסדות** במערכת.
          במדידה על 2,000 מוסדות מסך ההוצאות לקח 22.6 שניות והשרת קרס בזיכרון
          מבקשה אחת, כי כל צילומי הקבלות של כולם נטענו לזיכרון.

          אותה שאילתה עם סינון במסד: 67ms. עם אינדקס על GroupId: 2ms.
        */
        Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate);
        Task<T?> GetByIdAsync(int id);
        Task<T> AddAsync(T entity);
        Task UpdateAsync(T entity);
        Task DeleteAsync(T entity);
    }
}
