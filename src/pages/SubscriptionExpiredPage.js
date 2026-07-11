import { useNavigate } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Card from "../components/Card";
import "../styles/onboarding.css";

/*
  SubscriptionExpiredPage — מסך ידידותי כשתוקף המנוי הסתיים (UI_SPEC ס' 2,
  שלב 10). המנוי תקף עד ה-30.8 של השנה שאחרי הרכישה; כשהוא פג, השרת חוסם
  את הכניסה, ובמקום הודעת שגיאה מבלבלת מוצג כאן הסבר חם והזמנה לחדש.
  אין כאן סליקה — רק מסר. חידוש בפועל מתבצע מול VaadyGo.
*/
function SubscriptionExpiredPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <h1 className="auth-page__logo">
        <BrandName withHeart />
      </h1>
      <Card title="תוקף המנוי הסתיים 🗓️">
        <p className="welcome__text" style={{ textAlign: "right", margin: "0 0 12px" }}>
          המנוי שלך ב-<BrandName /> תקף לשנה שלמה, עד ה-30 באוגוסט — לקראת פתיחת
          שנת הלימודים הבאה. נראה שהתקופה הזאת הסתיימה.
        </p>
        <p className="welcome__text" style={{ textAlign: "right", margin: "0 0 12px" }}>
          <strong>כל הנתונים שלך שמורים ומחכים לך</strong> — התלמידים, הגבייה
          והתקציב. כדי להמשיך להשתמש, צריך רק לחדש את המנוי.
        </p>
        <p className="auth-page__hint" style={{ textAlign: "right" }}>
          לחידוש המנוי — צרי קשר עם <BrandName />, ונשמח לעזור 💜
        </p>
        <div className="auth-page__actions">
          <Button onClick={() => navigate("/login")}>חזרה למסך הכניסה</Button>
        </div>
      </Card>
    </div>
  );
}

export default SubscriptionExpiredPage;
