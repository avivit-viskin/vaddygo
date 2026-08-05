namespace ParentCommitteeAPI.Services
{
    /*
      IYearEndCleanupService — מחיקת נתוני השנה של גן לקראת שנת לימודים חדשה,
      כדי שלא יישמר מידע (במיוחד של ילדים והורים) אחרי שהילדים מתחלפים בגן.
      RunAsync סורק את כל הגנים ומבצע את המחיקה לגנים שהגיע מועדם.
    */
    public interface IYearEndCleanupService
    {
        Task RunAsync(CancellationToken cancellationToken = default);
    }
}
