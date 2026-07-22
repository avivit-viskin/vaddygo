import { useState } from "react";
import Card from "../components/Card";
import Checkbox from "../components/Checkbox";
import {
  getNotificationPrefs,
  setNotificationPref,
} from "../services/notificationPrefs";
import { isAiFinanceEnabled, setAiFinanceEnabled } from "../services/aiPrefs";
import {
  hasAnalyticsConsent,
  setCookieConsent,
} from "../services/cookieConsentService";
import { applyAnalyticsConsent } from "../services/analytics";
import ChangePasswordCard from "./settings/ChangePasswordCard";
import PaymentLinksCard from "./settings/PaymentLinksCard";
import BankAccountCard from "./settings/BankAccountCard";
import DeleteAccountCard from "./settings/DeleteAccountCard";
import TeamManager from "../components/TeamManager";
import "../styles/settings.css";

/*
  SettingsPage — הגדרות האפליקציה (משימה 12). בנוי כתפריט: רשימת נושאים קצרה,
  ולחיצה על נושא פותחת אותו במסך משלו עם כפתור "חזרה". כך המסך נשאר קצר וברור
  גם כשמצטברות עוד הגדרות.
*/
function SettingsPage() {
  // null = מסך התפריט; אחרת מפתח הנושא הפתוח
  const [section, setSection] = useState(null);
  const [prefs, setPrefs] = useState(getNotificationPrefs);
  const [aiFinance, setAiFinance] = useState(isAiFinanceEnabled);
  const [analytics, setAnalytics] = useState(hasAnalyticsConsent);

  function toggleAnalytics(event) {
    const on = event.target.checked;
    setCookieConsent(on ? "accepted" : "declined");
    applyAnalyticsConsent(on);
    setAnalytics(on);
  }

  function toggle(key) {
    return (event) => setPrefs(setNotificationPref(key, event.target.checked));
  }

  // כל נושא = פריט בתפריט + התוכן שלו במסך נפרד. הכותרת מוצגת פעם אחת בראש
  // המסך, ולכן כרטיסי ההתראות/פרטיות/צוות בפנים בלי כותרת כפולה.
  const SECTIONS = [
    {
      key: "notifications",
      icon: "🔔",
      title: "התראות",
      subtitle: "אילו התראות יופיעו בפעמון",
      render: () => (
        <Card>
          <p className="settings__hint">
            כאן בוחרים אילו התראות יופיעו בפעמון ובמסכים. אפשר לשנות בכל רגע.
          </p>
          <Checkbox
            id="pref-payments"
            label="תזכורות תשלום (מי עוד לא שילם)"
            checked={prefs.payments}
            onChange={toggle("payments")}
          />
          <Checkbox
            id="pref-birthdays"
            label="התראות ימי הולדת של הצוות"
            checked={prefs.birthdays}
            onChange={toggle("birthdays")}
          />
        </Card>
      ),
    },
    {
      key: "privacy",
      icon: "🔒",
      title: "פרטיות",
      subtitle: "נתוני AI ועוגיות מדידה",
      render: () => (
        <Card>
          <p className="settings__hint">
            עוזרת ה-AI יכולה לראות את המצב הכספי שלך (יתרה, גבייה והוצאות) כדי
            לתת תשובות מדויקות. המידע — סכומים בלבד, בלי שמות או טלפונים — נשלח
            ל-Google. אפשר לכבות כדי לא לשלוח אותו.
          </p>
          <Checkbox
            id="pref-ai-finance"
            label="לאפשר לעוזרת ה-AI לראות נתונים כספיים"
            checked={aiFinance}
            onChange={(event) =>
              setAiFinance(setAiFinanceEnabled(event.target.checked))
            }
          />
          <p className="settings__hint" style={{ marginTop: 12 }}>
            עוגיות מדידה/סטטיסטיקה (אנליטיקס) עוזרות לנו לשפר את השירות. אפשר
            לאשר או לבטל בכל רגע — כשמבטלים, לא נאסף מעקב כלל.
          </p>
          <Checkbox
            id="pref-analytics"
            label="לאפשר עוגיות מדידה/סטטיסטיקה"
            checked={analytics}
            onChange={toggleAnalytics}
          />
        </Card>
      ),
    },
    {
      key: "team",
      icon: "👥",
      title: "חברי ועד והרשאות",
      subtitle: "הוספה, עריכת הרשאה והסרה",
      render: () => (
        <Card>
          <p className="settings__hint">
            כאן אפשר להוסיף חברי ועד, לשנות את ההרשאה של כל אחד, או להסיר.
          </p>
          <TeamManager />
        </Card>
      ),
    },
    {
      key: "payments",
      icon: "💳",
      title: "תשלומים",
      subtitle: "קישורי ביט/פייבוקס וחשבון בנק",
      render: () => (
        <>
          <PaymentLinksCard />
          <BankAccountCard />
        </>
      ),
    },
    {
      key: "account",
      icon: "🔐",
      title: "חשבון וסיסמה",
      subtitle: "שינוי סיסמה ומחיקת חשבון",
      render: () => (
        <>
          <ChangePasswordCard />
          <DeleteAccountCard />
        </>
      ),
    },
  ];

  const active = SECTIONS.find((s) => s.key === section);

  // מסך נושא בודד — עם כפתור חזרה לתפריט
  if (active) {
    return (
      <div>
        <div className="page-header settings-section__header">
          <button
            type="button"
            className="settings-section__back"
            onClick={() => setSection(null)}
          >
            חזרה
          </button>
          <h2>
            {active.icon} {active.title}
          </h2>
        </div>
        {active.render()}
      </div>
    );
  }

  // מסך התפריט — רשימת הנושאים
  return (
    <div>
      <div className="page-header">
        <h2>הגדרות</h2>
      </div>
      <ul className="settings-menu">
        {SECTIONS.map((s) => (
          <li key={s.key}>
            <button
              type="button"
              className="settings-menu__item"
              onClick={() => setSection(s.key)}
            >
              <span className="settings-menu__icon" aria-hidden="true">
                {s.icon}
              </span>
              <span className="settings-menu__text">
                <span className="settings-menu__label">{s.title}</span>
                <span className="settings-menu__subtitle">{s.subtitle}</span>
              </span>
              <span className="settings-menu__chevron" aria-hidden="true">
                ‹
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SettingsPage;
