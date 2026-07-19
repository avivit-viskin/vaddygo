namespace ParentCommitteeAPI.Services
{
    public interface IAccountService
    {
        /*
          מוחק לצמיתות את המשתמש ואת כל הנתונים התלויים בו ("הזכות להימחק",
          חוק הגנת הפרטיות). מחזיר true אם המשתמש היה קיים ונמחק.
        */
        Task<bool> DeleteAccountAsync(int userId);
    }
}
