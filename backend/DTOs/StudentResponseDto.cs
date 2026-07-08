namespace ParentCommitteeAPI.DTOs
{
    /*
      StudentResponseDto — מה שחוזר ללקוח. לעולם לא מחזירים את מודל המסד עצמו,
      כדי שהלקוח לא יכיר את מבנה המסד ונוכל לשנות אותו בחופשיות.
    */
    public class StudentResponseDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public string ParentPhoneNumber { get; set; } = string.Empty;
    }
}
