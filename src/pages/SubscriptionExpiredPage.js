import { useNavigate } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Card from "../components/Card";
import { logout } from "../services/authService";
import { whatsappUrl } from "../services/whatsapp";
import "../styles/onboarding.css";

/*
  SubscriptionExpiredPage — מסך ידידותי כשתקופת הניסיון (חודש) או המנוי הסתיימו.
  כשהתוקף פג, ה-JWT פג גם הוא והשרת חוסם — כאן מציגים מסר חם והזמנה לחדש.
  החידוש כרגע דרך וואטסאפ; סליקה אוטומטית תתווסף בהמשך (ואז ״חידוש״ יגבה ויאריך).
*/
const RENEW_PHONE = "054-4579179";
const RENEW_MESSAGE = "היי, אשמח לחדש את המנוי שלי ב-VaddyGo 🙂";

function SubscriptionExpiredPage() {
  const navigate = useNavigate();
  const renewHref = `${whatsappUrl(RENEW_PHONE)}?text=${encodeURIComponent(RENEW_MESSAGE)}`;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="auth-page">
      <h1 className="auth-page__logo">
        <BrandName withHeart />
      </h1>
      <Card title="תוקף המנוי הסתיים 🗓️">
        <p className="welcome__text" style={{ textAlign: "right", margin: "0 0 12px" }}>
          תקופת הניסיון החינמית שלך ב-<BrandName /> (חודש) הסתיימה.
        </p>
        <p className="welcome__text" style={{ textAlign: "right", margin: "0 0 12px" }}>
          <strong>כל הנתונים שלך שמורים ומחכים לך</strong> — התלמידים, הגבייה
          והתקציב. כדי להמשיך להשתמש, צריך רק לחדש את המנוי.
        </p>
        <div className="auth-page__actions">
          <a
            href={renewHref}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none", display: "block" }}
          >
            <Button>חידוש המנוי בוואטסאפ 💬</Button>
          </a>
          <Button variant="secondary" onClick={handleLogout}>
            התנתקות
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default SubscriptionExpiredPage;
