import { useState } from "react";
import Card from "../components/Card";
import Checkbox from "../components/Checkbox";
import {
  getNotificationPrefs,
  setNotificationPref,
} from "../services/notificationPrefs";
import ChangePasswordCard from "./settings/ChangePasswordCard";
import PaymentLinksCard from "./settings/PaymentLinksCard";
import DeleteAccountCard from "./settings/DeleteAccountCard";
import "../styles/settings.css";

/*
  SettingsPage — הגדרות האפליקציה (משימה 12). כרגע: כיבוי/הדלקה של סוגי
  ההתראות (תזכורות תשלום, ימי הולדת). ההעדפה נשמרת מקומית ומשפיעה מיד על הפעמון.
*/
function SettingsPage() {
  const [prefs, setPrefs] = useState(getNotificationPrefs);

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
          בחרי אילו התראות יופיעו בפעמון ובמסכים. אפשר לשנות בכל רגע.
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

      <PaymentLinksCard />

      <ChangePasswordCard />

      <DeleteAccountCard />
    </div>
  );
}

export default SettingsPage;
