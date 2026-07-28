import { useState } from "react";
import Button from "./Button";
import {
  getCookieConsent,
  setCookieConsent,
} from "../services/cookieConsentService";
import { applyAnalyticsConsent } from "../services/analytics";

/*
  SupplierCookies — הגדרות עוגיות לספק: אפשר לאשר עוגיות מדידה/מעקב או לבטל
  אותן (להשאיר רק חיוניות), בדיוק כמו באתר. הבחירה נשמרת במכשיר ומשפיעה מיד.
*/
function SupplierCookies() {
  const [choice, setChoice] = useState(getCookieConsent());

  function choose(value) {
    setCookieConsent(value);
    applyAnalyticsConsent(value === "accepted");
    setChoice(value);
  }

  const statusText =
    choice === "accepted"
      ? "כרגע: עוגיות מדידה מאושרות"
      : choice === "declined"
      ? "כרגע: רק עוגיות חיוניות (בלי מעקב)"
      : "כרגע: טרם בחרתם";

  return (
    <div>
      <p className="supplier-edit__login-hint">
        עוגיות חיוניות תמיד פועלות (כניסה והעדפות). עוגיות מדידה עוזרות לנו לשפר
        את השירות — ואפשר לבטל אותן בכל רגע.
      </p>
      <p style={{ fontWeight: 700, margin: "4px 0 12px" }}>{statusText}</p>
      <div
        className="gift-form__actions"
        style={{ gap: 8, flexWrap: "wrap" }}
      >
        <Button onClick={() => choose("accepted")}>אישור עוגיות מדידה</Button>
        <Button variant="secondary" onClick={() => choose("declined")}>
          ביטול המעקב (רק חיוניות)
        </Button>
      </div>
    </div>
  );
}

export default SupplierCookies;
