/*
  cookieConsentService — בחירת העוגיות של המשתמש/ת (נשמרת במכשיר):
    "accepted" = מאשר/ת גם עוגיות מדידה/מעקב (אנליטיקס, פיקסל) — מעבר לחיוניות.
    "declined" = רק עוגיות חיוניות (התחברות/העדפות), בלי מעקב.
    null / ערך ישן = טרם בחרו → מציגים את באנר האישור.
  זו נקודת האמת היחידה שממנה קוד המעקב (analytics) יודע אם מותר לו לרוץ.
*/
const CONSENT_KEY = "vaadygo.cookieConsent";

export function getCookieConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

/* האם כבר נבחרה אחת האפשרויות התקינות (accept/decline) — אחרת מציגים באנר */
export function hasCookieChoice() {
  const value = getCookieConsent();
  return value === "accepted" || value === "declined";
}

/* האם אישרו עוגיות מדידה/מעקב — קוד המעקב יירוץ *רק* אם זה true */
export function hasAnalyticsConsent() {
  return getCookieConsent() === "accepted";
}

export function setCookieConsent(value) {
  // value: "accepted" | "declined"
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // אחסון חסום — הבחירה לא נשמרת, אך תכובד לפגישה הנוכחית
  }
}
