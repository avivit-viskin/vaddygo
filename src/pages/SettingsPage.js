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
  SettingsPage — הגדרות האפליקציה (משימה 12). כרגע: כיבוי/הדלקה של סוגי
  ההתראות (תזכורות תשלום, ימי הולדת). ההעדפה נשמרת מקומית ומשפיעה מיד על הפעמון.
*/
function SettingsPage() {
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

  return (
    <div>
      <div className="page-header">
        <h2>הגדרות</h2>
      </div>

      <Card title="🔔 התראות">
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

      <Card title="🔒 פרטיות">
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

      <Card title="👥 חברי ועד והרשאות">
        <p className="settings__hint">
          כאן אפשר להוסיף חברי ועד, לשנות את ההרשאה של כל אחד, או להסיר.
        </p>
        <TeamManager />
      </Card>

      <PaymentLinksCard />

      <BankAccountCard />

      <ChangePasswordCard />

      <DeleteAccountCard />
    </div>
  );
}

export default SettingsPage;
