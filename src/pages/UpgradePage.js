import { useNavigate, Link } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import Icon from "../components/Icon";
import BrandName from "../components/BrandName";
import { PRO_PRICE, PRO_FEATURES, isPro } from "../services/plan";
import { whatsappUrl } from "../services/whatsapp";
import "../styles/pro.css";

/*
  UpgradePage (/upgrade) — מרכז הפרו: כל כלי הפרו במקום אחד (כל אחד מוביל למסך
  שלו), המחיר (₪149/שנה), וכפתור תשלום מאובטח (עמוד GROW). שלב א': שום דבר לא
  חסום — הכלים פתוחים לכולם, וזה רק "אזור השדרוגים" המרכזי.
*/
const SUPPORT_PHONE = "054-4579179";

const PRO_TOOLS = [
  { path: "/annual-report", icon: "receipt", label: "דוח שנתי להורים", desc: "סיכום כספי שקוף — להדפסה, PDF ושיתוף" },
  { path: "/reminders", icon: "bell", label: "תזכורות אוטומטיות", desc: "המערכת עוקבת מי מחכה לתזכורת — ואת שולחת" },
  { path: "/polls", icon: "check-circle", label: "סקרים והצבעות", desc: "שאלה להורים עם תוצאות חיות" },
  { path: "/backup", icon: "package", label: "גיבוי והשוואת שנים", desc: "גיבוי מלא והשוואה בין השנים" },
  { path: "/branding", icon: "image", label: "מיתוג אישי לגן", desc: "לוגו וצבע הגן על הדוח" },
  { path: "/contacts", icon: "users", label: "ספר קשרים ושליחה", desc: "כל ההורים במקום אחד + שליחה מרוכזת" },
];

const ALSO_INCLUDED = [
  PRO_FEATURES.ai,
  PRO_FEATURES.multiInstitution,
  PRO_FEATURES.teamRoles,
  PRO_FEATURES.prioritySupport,
];

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
            שדרוגי <BrandName /> פרו
          </h2>
          <p className="upgrade-price">
            <span className="upgrade-price__num">₪{PRO_PRICE}</span>
            <span className="upgrade-price__per"> / שנה לארגון</span>
          </p>
          <p className="upgrade-subtitle">
            כל מה שיש בחינם — ובנוסף כל הכלים המתקדמים האלה, במקום אחד:
          </p>
        </div>

        <ul className="upgrade-tools">
          {PRO_TOOLS.map((tool) => (
            <li key={tool.path}>
              <Link to={tool.path} className="upgrade-tool">
                <span className="upgrade-tool__icon">
                  <Icon name={tool.icon} size={22} />
                </span>
                <span className="upgrade-tool__body">
                  <span className="upgrade-tool__label">{tool.label}</span>
                  <span className="upgrade-tool__desc">{tool.desc}</span>
                </span>
                <span className="upgrade-tool__arrow" aria-hidden="true">
                  ‹
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="upgrade-also">כולל גם: {ALSO_INCLUDED.join(" · ")}</p>

        <p className="upgrade-note">
          <Icon name="crown" size={15} />
          <span>מסלול הפרו פעיל — הכלים המתקדמים נפתחים עם השדרוג.</span>
        </p>

        <div className="upgrade-actions">
          {alreadyPro ? (
            <p className="upgrade-note">
              <Icon name="check-circle" size={16} />
              <span>את כבר במסלול פרו — כל הכלים פתוחים לך 👑</span>
            </p>
          ) : (
            <>
              <Link
                to={`/pay?pro=1&amount=${PRO_PRICE}&for=${encodeURIComponent(
                  "מנוי פרו"
                )}`}
              >
                <Button variant="brand">
                  <Icon name="card" size={16} /> מעבר לתשלום ושדרוג
                </Button>
              </Link>
              <a href={contactUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary">
                  <Icon name="message" size={16} /> אשמח לשמוע עוד
                </Button>
              </a>
            </>
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
