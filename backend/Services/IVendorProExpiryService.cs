namespace ParentCommitteeAPI.Services
{
    /*
      IVendorProExpiryService — התראת מייל לספק שבועיים לפני שמסלול הפרו שלו פג
      (פעם אחת בכל מחזור). RunAsync סורק את הספקים ושולח למי שמתאים.
    */
    public interface IVendorProExpiryService
    {
        Task RunAsync(CancellationToken cancellationToken = default);
    }
}
