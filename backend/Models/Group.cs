namespace ParentCommitteeAPI.Models
{
    /*
      Group — הגן/בית הספר שהוועד מנהל, כפי שמוגדר באשף ההרשמה (UI_SPEC ס' 3-6).
      Subgroups נשמר כמחרוזת מופרדת בפסיקים (למשל "תינוקייה,פעוטות") —
      החלטה מודעת (KISS): לקבוצות אין עדיין התנהגות משלהן; אם תהיה, ינורמלו לטבלה.
    */
    public class Group
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public int ChildrenCount { get; set; }
        public int StaffCount { get; set; }
        public string Subgroups { get; set; } = string.Empty;

        // קטגוריות הגבייה של הגן (הזנה, דמי ועד...) — יעד הגבייה נגזר מהן
        public List<CollectionCategory> Categories { get; set; } = new();
    }
}
