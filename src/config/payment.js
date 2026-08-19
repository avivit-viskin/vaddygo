/*
  payment — קישור התשלום למנוי הפרו (עמוד תשלום קבוע ב-GROW).

  זהו קישור אחד לכל המערכת — התשלום הוא ל-VaddyGo (לא לכל ועד בנפרד).
  כשיהיה לך הקישור מ-GROW, יש שתי דרכים להפעיל את הכפתור "מעבר לתשלום מאובטח"
  בעמוד השדרוג:
    1. הכי פשוט: לשלוח לי את הקישור ואני אדביק אותו כאן בין המרכאות.
    2. או להגדיר ב-Railway (שירות הפרונט) משתנה בשם REACT_APP_PRO_PAYMENT_URL.
  כל עוד ריק — הכפתור פשוט לא מוצג (ונשאר "אשמח לשמוע עוד").
*/
export const PRO_PAYMENT_URL =
  process.env.REACT_APP_PRO_PAYMENT_URL ||
  "https://pay.grow.link/MTAzODcx~2e4901218c89fe0e314cda81ad69aedd-MzgwMTEwMg";

/*
  קישור התשלום למסלול הפרו של **הספקים** (₪1,200 לשנה) — עמוד תשלום נפרד
  ב-GROW, כי הסכום שונה מזה של הוועד (₪149).

  הקישור התקבל מבעלת המוצר ב-10.08.2026 ואומת: העמוד נטען (200) ומציג 1200.
  לשינוי בעתיד — אפשר להחליף כאן, או להגדיר ב-Railway (שירות הפרונט) משתנה
  בשם REACT_APP_SUPPLIER_PRO_PAYMENT_URL, שגובר על הערך שכאן.

  ⚠️ אם הערך ריק — כפתור הרכישה בפורטל הספק **אינו מוצג**, במקום להוביל לשום
  מקום. לא ממציאים כאן כתובת: קישור תשלום שגוי = כסף שנכנס לחשבון הלא-נכון.
*/
export const SUPPLIER_PRO_PAYMENT_URL =
  process.env.REACT_APP_SUPPLIER_PRO_PAYMENT_URL ||
  "https://pay.grow.link/MTAzODcx~d57e8328c5534416d8c134d4e058e97e-MzgxNzQ1NQ";

/*
  buildPurchaseUrl — מוסיף לקישור התשלום שדות-מזהה (custom fields) של מי שרוכש,
  כדי שכש-GROW ישלח את ה-webhook אחרי התשלום, נדע למי לפתוח פרו. GROW מחזיר בחזרה
  שדות מסוג cField1..cField10. שולחים: cField1=מזהה גן (ועד), cField4=מזהה ספק,
  cField2=מייל, cField3=סוג. אם GROW לא יחזיר אותם — השרת עדיין מזהה לפי מייל המשלם.
*/
export function buildPurchaseUrl(baseUrl, fields = {}) {
  if (!baseUrl) {
    return baseUrl;
  }
  try {
    const url = new URL(baseUrl);
    Object.entries(fields).forEach(([key, value]) => {
      if (value != null && String(value).trim().length > 0) {
        url.searchParams.set(key, String(value).trim());
      }
    });
    return url.toString();
  } catch {
    return baseUrl;
  }
}
