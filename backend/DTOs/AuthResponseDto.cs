namespace ParentCommitteeAPI.DTOs
{
    /*
      AuthResponseDto — מה שחוזר ללקוח אחרי הרשמה/כניסה מוצלחת:
      ה-token להצגה בכל בקשה, ופרטי המנוי להצגה ולבדיקת תוקף בצד הלקוח.
    */
    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = "Member";
        public DateTime SubscriptionValidUntil { get; set; }
    }
}
