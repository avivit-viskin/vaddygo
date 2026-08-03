import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import Icon from "../components/Icon";
import BrandName from "../components/BrandName";
import { PRO_PRICE, PRO_FEATURES, isPro } from "../services/plan";
import { whatsappUrl } from "../services/whatsapp";
import "../styles/pro.css";

/*
  UpgradePage (/upgrade) — עמוד השדרוג למסלול הפרו. מציג את המחיר (₪149/שנה)
  ואת רשימת הטבות הפרו (מקור אמת יחיד: PRO_FEATURES ב-services/plan.js).
  שלב א': אין עדיין חיוב בפועל — לכן ה-CTA הוא פנייה לתמיכה ("אשמח לשמוע עוד"),
  והעמוד מבהיר בכנות שכל הפיצ'רים עדיין פתוחים לכולם.
*/
const SUPPORT_PHONE = "054-4579179";

function UpgradePage() {
  const navigate = useNavigate();
  const alreadyPro = isPro();
  const contactUrl = `${whatsappUrl(SUPPORT_PHONE)}?text=${encodeURIComponent(
    "היי, אשמח לשמוע עוד על מסלול הפרו של VaddyGo 🙂"
  )}`;

  return (
    <div className="upgrade-page">
      <Card>
        <div className="upgrade-hero">
          <span className="upgrade-crown">
            <Icon name="crown" size={40} title="פרו" />
          </span>
          <h2 className="upgrade-title">
            שדרוג ל־<BrandName /> פרו
          </h2>
          <p className="upgrade-price">
            <span className="upgrade-price__num">₪{PRO_PRICE}</span>
            <span className="upgrade-price__per"> / שנה לארגון</span>
          </p>
          <p className="upgrade-subtitle">
            כל מה שיש בחינם — ובנוסף אוטומציות, עוזרת AI וניהול בקנה מידה גדול.
          </p>
        </div>

        <ul className="upgrade-features">
          {Object.entries(PRO_FEATURES).map(([key, label]) => (
            <li key={key} className="upgrade-feature">
              <Icon name="check" size={18} /> {label}
            </li>
          ))}
        </ul>

        <p className="upgrade-note">
          <Icon name="clock" size={15} />
          <span>
            כרגע כל הפיצ'רים פתוחים לכולם — מסלול הפרו ייכנס לתוקף בהמשך. הכתר
            מסמן מה ייכלל בפרו.
          </span>
        </p>

        <div className="upgrade-actions">
          {!alreadyPro && (
            <a href={contactUrl} target="_blank" rel="noreferrer">
              <Button variant="brand">
                <Icon name="message" size={16} /> אשמח לשמוע עוד
              </Button>
            </a>
          )}
          <Button variant="secondary" onClick={() => navigate(-1)}>
            חזרה
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default UpgradePage;
