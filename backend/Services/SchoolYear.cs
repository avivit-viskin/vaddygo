namespace ParentCommitteeAPI.Services
{
    /*
      SchoolYear — כלל אחד משותף לכל המערכת לקביעת שנת הלימודים:
      מיולי ואילך נערכים לשנה שנפתחת בספטמבר הקרוב (השנה הלועזית הנוכחית);
      עד יוני — השנה שנפתחה בספטמבר הקודם.
    */
    public static class SchoolYear
    {
        public static int Current()
        {
            var today = DateTime.Today;
            return today.Month >= 7 ? today.Year : today.Year - 1;
        }
    }
}
