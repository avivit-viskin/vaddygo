/*
  whatsapp — בניית קישור וואטסאפ מקלט חופשי (מספר טלפון או קישור מלא).
  משמש את דף הספק (מסך המתנות) לכפתור "וואטסאפ" ישיר.
*/
export function whatsappUrl(value) {
  const raw = (value || "").trim();
  if (!raw) {
    return "";
  }
  // אם הוזן קישור מלא (wa.me / https) — משתמשים בו כמו שהוא
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  // אחרת מתייחסים למספר טלפון: וואטסאפ דורש קידומת מדינה בלי אפס מוביל
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  const international = digits.startsWith("0") ? `972${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}

/*
  whatsappShareUrl — קישור שיתוף עם טקסט מוכן, בלי נמען מוגדר:
  וואטסאפ נפתח עם ההודעה מוקלדת והמשתמשת בוחרת למי לשלוח.
*/
export function whatsappShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text || "")}`;
}
