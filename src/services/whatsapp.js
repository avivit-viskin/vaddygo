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
  וואטסאפ נפתח עם ההודעה מוקלדת ובוחרים למי לשלוח.
*/
export function whatsappShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text || "")}`;
}

/*
  whatsappUrlWithText — קישור וואטסאפ ישיר לנמען לפי מספר טלפון, עם הודעה מוכנה:
  וואטסאפ נפתח כבר בשיחה עם אותו אדם וההודעה מוקלדת (נשאר רק ללחוץ "שליחה").
  אם אין מספר טלפון תקין — נופלים לקישור שיתוף כללי (בוחרים נמען ידנית).
*/
export function whatsappUrlWithText(phone, text) {
  const encoded = encodeURIComponent(text || "");
  const digits = (phone || "").replace(/\D/g, "");
  if (digits) {
    const international = digits.startsWith("0")
      ? `972${digits.slice(1)}`
      : digits;
    return `https://wa.me/${international}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

// ביטויים ש"מסגירים" פסקה פותחת/מסיימת של שיחה עם המשתמשת (לא חלק מההודעה עצמה)
const CHATTY_MARKERS =
  /(איך זה נשמע|רוצה ש|אם תרצי|אם רוצה|אם את רוצה|ספרי לי|תגידי לי|כתבי לי|מקווה שעזר|שאדייק|שאתאים|אשמח לעזור|אשמח לדייק|הנה הצעה|הנה נוסח|הנה טיוטה|בואי ננסח|אפשר גם|רוצה שאני)/;

/*
  extractShareMessage — מתוך תשובת העוזרת מחזיר רק את ההודעה המוכנה לשליחה
  (ההזמנה/התזכורת עצמה), בלי הפתיח והסיום ה"משוחחים" של העוזרת. תשובה קצרה
  של פסקה אחת מוחזרת כמו שהיא. תמיד נשארת נפילה בטוחה לטקסט המלא.
*/
export function extractShareMessage(answer) {
  const text = (answer || "").trim();
  if (!text) {
    return "";
  }
  const paras = text
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paras.length <= 1) {
    return text;
  }

  const isChatty = (p) =>
    /[?？]$/.test(p) ||
    CHATTY_MARKERS.test(p) ||
    /^(היי+|בשמחה|כמובן|בטח+)\b/.test(p);

  let start = 0;
  let end = paras.length - 1;
  // מסירים פסקה פותחת "משוחחת" (הצעה/שאלה למשתמשת) ופסקה מסיימת כזו
  if (isChatty(paras[start]) && end > start) {
    start += 1;
  }
  if (isChatty(paras[end]) && end > start) {
    end -= 1;
  }

  const core = paras.slice(start, end + 1).join("\n\n").trim();
  return core || text;
}
