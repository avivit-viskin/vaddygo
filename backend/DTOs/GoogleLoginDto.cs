using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      GoogleLoginDto — ה-credential (ID token) שמחזיר כפתור "כניסה עם Google"
      בצד הלקוח (Google Identity Services). השרת מאמת אותו מול גוגל.
    */
    public class GoogleLoginDto
    {
        [Required(ErrorMessage = "חסר אסימון הזדהות מגוגל")]
        public string Credential { get; set; } = string.Empty;
    }
}
