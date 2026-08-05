/*
  branding — מיתוג אישי לגן (פיצ'ר פרו): לוגו וצבע מותג שנשמרים מקומית ומוחלים
  על הדוח השנתי להורים (ובעתיד על עוד חומרים מודפסים). הלוגו נשמר כ-base64
  מכווץ (imageUpload), בלי תשתית אחסון.
*/
const KEY = "vaadygo.branding";
const EMPTY = { logo: null, color: null };

export function getBranding() {
  try {
    return { ...EMPTY, ...(JSON.parse(localStorage.getItem(KEY)) || {}) };
  } catch {
    return { ...EMPTY };
  }
}

export function setBranding(patch) {
  const next = { ...getBranding(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // אחסון חסום — לא קריטי
  }
  return next;
}

export function clearLogo() {
  return setBranding({ logo: null });
}
