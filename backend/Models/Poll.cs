namespace ParentCommitteeAPI.Models
{
    /*
      Poll — סקר של הוועד ("איזו מתנה לגננת?"). ההורים עונים דרך קישור ציבורי,
      בלי חשבון ובלי התחברות: ה-PublicToken (GUID לא-ניתן-לניחוש) הוא כתובת
      הסקר. התוצאות מתעדכנות אצל הוועד אוטומטית — אין יותר ספירה ידנית.

      שייך לגן (GroupId) כדי שכל ועד יראה את הסקרים שלו בלבד.
    */
    public class Poll
    {
        public int Id { get; set; }

        // הגן שהסקר שייך לו — מקור האמת לבקרת גישה (כמו בשאר הישויות)
        public int? GroupId { get; set; }

        public string Question { get; set; } = string.Empty;

        /* כתובת הסקר הציבורית. מי שמחזיק בקישור יכול לענות — ורק לענות:
           דרך הטוקן אי אפשר לערוך, למחוק או להגיע לסקרים אחרים. */
        public string PublicToken { get; set; } = string.Empty;

        /* סקר סגור לא מקבל עוד תשובות, אבל התוצאות נשארות לצפייה. */
        public bool IsClosed { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<PollOption> Options { get; set; } = new();
    }

    /*
      PollOption — אפשרות בסקר. Votes הוא מונה מצטבר לתצוגה מהירה; מקור האמת
      המפורט הוא רשומות PollVote (מהן גם נמנעת הצבעה כפולה).
    */
    public class PollOption
    {
        public int Id { get; set; }
        public int PollId { get; set; }
        public Poll? Poll { get; set; }

        public string Text { get; set; } = string.Empty;
        public int Votes { get; set; }
    }

    /*
      PollVote — הצבעה בודדת. VoterKey הוא מזהה אקראי שנוצר בדפדפן של ההורה
      ונשמר אצלו, ומאפשר למנוע הצבעה כפולה *בטעות* (רענון/לחיצה חוזרת).
      זו אינה הזדהות — הורה שממש ירצה יוכל להצביע שוב ממכשיר אחר; לוועד הורים
      זו רמת ההגנה הנכונה, ואינה דורשת לאסוף פרטים מזהים מההורים.
    */
    public class PollVote
    {
        public int Id { get; set; }
        public int PollId { get; set; }
        public int OptionId { get; set; }
        public string VoterKey { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
