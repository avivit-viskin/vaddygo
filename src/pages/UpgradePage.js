import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import Icon from "../components/Icon";
import BrandName from "../components/BrandName";
import { PRO_PRICE, PRO_FEATURES, isPro } from "../services/plan";
import { getActiveInstitution } from "../services/institutionsService";
import { getUser } from "../services/authService";
import { whatsappUrl } from "../services/whatsapp";
import { PRO_PAYMENT_URL, buildPurchaseUrl } from "../config/payment";
import "../styles/pro.css";
import "../styles/upgrade-extras.css";

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

// "עוד יכולות" — יכולות שכלולות במסלול אך אין להן כרטיס-כלי משלהן למעלה:
// עוזר ה-AI, ריבוי מוסדות, הרשאות צוות ותמיכה בעדיפות. מוצגות בריבוע נפרד עם
// אייקון ותיאור, במקום שורת טקסט קטנה.
const MORE_FEATURES = [
  {
    label: PRO_FEATURES.ai,
    icon: "robot",
    desc: "עוזר חכם שעונה על שאלות, מסכם נתונים ומנסח הודעות להורים — בעברית.",
  },
  {
    label: PRO_FEATURES.teamRoles,
    icon: "users",
    desc: "הרשאות לצוות הוועד: ניהול מלא, עריכה או צפייה בלבד — כל אחד לפי תפקידו.",
  },
  {
    label: PRO_FEATURES.prioritySupport,
    icon: "message",
    desc: "מענה מהיר ואישי לכל שאלה, ישירות בוואטסאפ.",
  },
];

function UpgradePage() {
  const navigate = useNavigate();
  const alreadyPro = isPro();
  // הפרו הוא לכל גן בנפרד — מציגים על איזה גן חל השדרוג, כדי שברור מה משדרגים.
  const active = getActiveInstitution();
  const ganName = active?.name;
  // קישור התשלום עם שדות-מזהה של הגן והמשלם — כדי שה-webhook מ-GROW ידע למי
  // לפתוח פרו אוטומטית אחרי התשלום.
  const payUrl = buildPurchaseUrl(PRO_PAYMENT_URL, {
    cField1: active?.serverGroupId,
    cField2: getUser()?.email,
    cField3: "committee",
  });
  // כשספק/ועד שאינו פרו לוחץ על כלי — לא מנווטים, אלא מציגים הודעה שהשירות
  // נפתח עם השדרוג (המשתמשת ביקשה חיווי ברור לפני הרכישה).
  const [lockedMsg, setLockedMsg] = useState(false);
  const contactUrl = `${whatsappUrl(SUPPORT_PHONE)}?text=${encodeURIComponent(
    "היי, אשמח לשמוע עוד על מסלול הפרו של VaddyGo 🙂"
  )}`;

  return (
    <div className="upgrade-page">
      <Card>
        <div className="upgrade-hero">
          {/* לפני רכישה — כתר (סימן שטרם נרכש). אחרי רכישה — חיווי "פעיל" למעלה. */}
          {alreadyPro ? (
            <span className="upgrade-active-badge">
              <Icon name="check-circle" size={16} /> המסלול פעיל
            </span>
          ) : (
            <span className="upgrade-crown">
              <Icon name="crown" size={40} title="פרו" />
            </span>
          )}
          <h2 className="upgrade-title">
            שדרוגי <BrandName /> פרו
          </h2>
          <p className="upgrade-price">
            <span className="upgrade-price__num">₪{PRO_PRICE}</span>
            <span className="upgrade-price__per"> / שנה לגן</span>
          </p>
          {ganName && (
            <p className="upgrade-subtitle">
              השדרוג חל על הגן <strong>{ganName}</strong> — כל גן משודרג בנפרד.
            </p>
          )}
          <p className="upgrade-subtitle">
            כל מה שיש בחינם — ובנוסף כל הכלים המתקדמים האלה, במקום אחד:
          </p>
        </div>

        {lockedMsg && !alreadyPro && (
          <p className="upgrade-locked-msg" role="status">
            <Icon name="lock" size={16} />
            <span>
              הכלי הזה נפתח במסלול הפרו. אפשר לשדרג כאן למטה ולקבל גישה מיידית 🙂
            </span>
          </p>
        )}

        <ul className="upgrade-tools">
          {PRO_TOOLS.map((tool) => (
            <li key={tool.path}>
              <Link
                to={tool.path}
                className={`upgrade-tool${alreadyPro ? "" : " upgrade-tool--locked"}`}
                onClick={(e) => {
                  // לפני רכישת פרו — לא מנווטים לכלי, אלא מציגים חיווי שהוא נעול
                  if (!alreadyPro) {
                    e.preventDefault();
                    setLockedMsg(true);
                  }
                }}
              >
                <span className="upgrade-tool__icon">
                  <Icon name={tool.icon} size={22} />
                </span>
                <span className="upgrade-tool__body">
                  <span className="upgrade-tool__label">{tool.label}</span>
                  <span className="upgrade-tool__desc">{tool.desc}</span>
                </span>
                <span className="upgrade-tool__arrow" aria-hidden="true">
                  {alreadyPro ? "‹" : <Icon name="lock" size={16} />}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* עוד יכולות שכלולות במסלול — עוזר AI, הרשאות צוות, ריבוי מוסדות ותמיכה */}
        <div className="upgrade-more">
          <h3 className="upgrade-more__title">עוד יכולות שכלולות במסלול</h3>
          <ul className="upgrade-more__list">
            {MORE_FEATURES.map((f) => (
              <li key={f.label} className="upgrade-more__item">
                <span className="upgrade-more__icon">
                  <Icon name={f.icon} size={20} />
                </span>
                <span className="upgrade-more__body">
                  <span className="upgrade-more__label">{f.label}</span>
                  <span className="upgrade-more__desc">{f.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="upgrade-actions">
          {alreadyPro ? (
            <p className="upgrade-note">
              <Icon name="check-circle" size={16} />
              <span>
                {ganName ? `הגן ${ganName} כבר במסלול פרו` : "את כבר במסלול פרו"} —
                כל הכלים פתוחים לך
              </span>
            </p>
          ) : (
            <>
              {PRO_PAYMENT_URL && (
                <a href={payUrl} target="_blank" rel="noreferrer">
                  <Button variant="brand">
                    <Icon name="card" size={16} /> מעבר לתשלום מאובטח
                  </Button>
                </a>
              )}
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
