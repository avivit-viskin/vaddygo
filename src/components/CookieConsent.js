import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/cookie-consent.css";

/*
  CookieConsent — הודעת עוגיות/אחסון שמופיעה בכניסה למערכת (גם לפני התחברות),
  ודורשת אישור מפורש מהמשתמשת ("אני מאשר/ת"). המערכת משתמשת רק באחסון חיוני
  (התחברות והעדפות). אחרי האישור נשמר סימון וההודעה לא מוצגת שוב.
*/
const CONSENT_KEY = "vaadygo.cookieConsent";

function CookieConsent() {
  const [accepted, setAccepted] = useState(() => {
    try {
      return localStorage.getItem(CONSENT_KEY) === "1";
    } catch {
      return true; // אחסון חסום — לא מציקים בהודעה
    }
  });

  if (accepted) {
    return null;
  }

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {
      // אחסון חסום — פשוט סוגרים להצגה הנוכחית
    }
    setAccepted(true);
  }

  return (
    <div className="cookie-consent" role="dialog" aria-modal="true" aria-label="אישור עוגיות">
      <div className="cookie-consent__box">
        <p className="cookie-consent__text">
          🍪 אנחנו משתמשים בעוגיות ובאחסון מקומי כדי שהמערכת תפעל (התחברות
          והעדפות). כדי להמשיך יש לאשר. לפרטים:{" "}
          <Link to="/cookies">מדיניות העוגיות</Link>.
        </p>
        <button type="button" className="cookie-consent__btn" onClick={accept}>
          אני מאשר/ת
        </button>
      </div>
    </div>
  );
}

export default CookieConsent;
