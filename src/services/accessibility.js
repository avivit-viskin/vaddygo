/*
  accessibility — הגדרות הנגישות של המשתמש/ת (נשמרות במכשיר) והחלתן על כל האתר.
  ההחלה נעשית ע"י הוספת מחלקות ל-<html>, שמגדירות מחדש את משתני העיצוב
  (גדלי פונט/צבעים) — ולכן חלות מיד על כל הרכיבים שמשתמשים במשתנים. תואם ת"י 5568.
*/
const KEY = "vaadygo.a11y";
const DEFAULTS = { font: 0, contrast: false, links: false, readable: false };

export function getA11ySettings() {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY)) || {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveA11ySettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // אחסון חסום — ההגדרות יחולו לפגישה הנוכחית בלבד
  }
  applyA11ySettings(settings);
  return settings;
}

/* מחיל את ההגדרות על <html> (נקרא גם בעליית האפליקציה, כדי שיישמרו בין ביקורים) */
export function applyA11ySettings(settings = getA11ySettings()) {
  const root = document.documentElement;
  root.classList.remove("a11y-font-1", "a11y-font-2", "a11y-font-3");
  if (settings.font >= 1 && settings.font <= 3) {
    root.classList.add(`a11y-font-${settings.font}`);
  }
  root.classList.toggle("a11y-contrast", Boolean(settings.contrast));
  root.classList.toggle("a11y-links", Boolean(settings.links));
  root.classList.toggle("a11y-readable", Boolean(settings.readable));
}
