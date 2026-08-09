namespace ParentCommitteeAPI.Services
{
    /*
      IDatabaseBackupService — גיבוי אוטומטי של מסד הנתונים.
      מחזיר את נתיב הקובץ שנוצר, או null אם לא בוצע גיבוי (למשל כשהמסד אינו
      SQLite, או כשהגיבוי כבוי בהגדרות).
    */
    public interface IDatabaseBackupService
    {
        Task<string?> RunAsync(CancellationToken cancellationToken = default);
    }
}
