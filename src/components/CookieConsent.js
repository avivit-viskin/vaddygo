import { useState } from "react";
import { Link } from "react-router-dom";
import {
  hasCookieChoice,
  setCookieConsent,
} from "../services/cookieConsentService";
import { applyAnalyticsConsent } from "../services/analytics";
import "../styles/cookie-consent.css";

/*
  CookieConsent — באנר אישור עוגיות שמופיע בכניסה למערכת (גם לפני התחברות),
  ודורש בחירה מפורשת: "אני מאשר/ת" (כולל עוגיות מדידה) או "לא מאשר/ת" (רק
  עוגיות חיוניות, בלי מעקב). שני הכפתורים באותו גודל — בלי "דפוסים אפלים".
  אם מסרבים — קוד המעקב פשוט לא ירוץ (applyAnalyticsConsent(false)).
*/
function CookieConsent() {
  const [chosen, setChosen] = useState(hasCookieChoice);

  if (chosen) {
    return null;
  }

  function choose(value) {
    setCookieConsent(value);
    applyAnalyticsConsent(value === "accepted");
    setChosen(true);
  }

  return (
    <div
      className="cookie-consent"
      role="dialog"
      aria-modal="true"
      aria-label="אישור עוגיות"
    >
      <div className="cookie-consent__box">
        <p className="cookie-consent__text">
          🍪 אנחנו משתמשים בעוגיות חיוניות כדי שהמערכת תפעל. נשמח להשתמש גם
          בעוגיות מדידה כדי לשפר את השירות. אפשר לאשר או לסרב — לפרטים:{" "}
          <Link to="/cookies">מדיניות העוגיות</Link>.
        </p>
        <div className="cookie-consent__actions">
          <button
            type="button"
            className="cookie-consent__btn cookie-consent__btn--accept"
            onClick={() => choose("accepted")}
          >
            אני מאשר/ת
          </button>
          <button
            type="button"
            className="cookie-consent__btn cookie-consent__btn--decline"
            onClick={() => choose("declined")}
          >
            לא מאשר/ת
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
