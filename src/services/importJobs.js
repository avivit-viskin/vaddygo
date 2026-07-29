/*
  importJobs — מנהל "משימת ייבוא" ברמת המודול (מחוץ למחזור-החיים של רכיבי React),
  כדי שחילוץ מוצרים מקובץ/צילום ימשיך לרוץ ברקע גם אם עוברים בין הטאבים באזור
  הספק (הטופס נעלם ונטען מחדש). כשהמשימה מסתיימת, התוצאה נשמרת כאן וממתינה עד
  שטופס המוצרים ייטען וייקח אותה. יש משימה אחת פעילה בכל רגע (מייבאים קובץ אחד).

  הערה: זה שורד מעבר בין מסכים באפליקציה, אבל *סגירה מלאה* של האפליקציה עוצרת את
  ה-JS ולכן גם את הייבוא — אין דרך אמינה בצד-לקוח להמשיך אחרי סגירה מוחלטת.
*/
let job = null; // { key, status: "loading"|"done"|"empty"|"error", message, products }
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn(job);
    } catch {
      // מאזין בודד שנכשל לא יפיל את השאר
    }
  });
}

export function getImportJob() {
  return job;
}

export function subscribeImportJob(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function clearImportJob() {
  job = null;
  emit();
}

export function isImportRunning() {
  return !!job && job.status === "loading";
}

/*
  לוקח את המוצרים ממשימה שהסתיימה (status "done") עבור אותו מפתח (vendor id),
  ומנקה אותה — כדי שהטופס יוסיף אותם פעם אחת בלבד. מחזיר null אם אין מה לקחת.
*/
export function consumeImportJob(key) {
  if (job && job.key === key && job.status === "done") {
    const products = job.products || [];
    job = null;
    emit();
    return products;
  }
  return null;
}

/*
  מתחיל משימת ייבוא: extract() הוא הבטחה שמחזירה רשימת מוצרים (חילוץ קובץ/צילום).
  מעדכן סטטוס לאורך הדרך, כדי שטופס המוצרים והבאנר הגלובלי יוכלו להציג התקדמות.
*/
export async function startImportJob(key, { loadingMessage, extract }) {
  if (job && job.status === "loading") {
    return; // כבר רצה משימה — מייבאים אחד בכל פעם
  }
  job = { key, status: "loading", message: loadingMessage, products: [] };
  emit();
  try {
    const products = await extract();
    if (!products || products.length === 0) {
      job = {
        key,
        status: "empty",
        message: "לא זוהו מוצרים. אפשר לנסות שוב, או ייבוא Excel/CSV.",
        products: [],
      };
      emit();
      return;
    }
    job = {
      key,
      status: "done",
      message: `זוהו ${products.length} מוצרים ✓`,
      products,
    };
    emit();
  } catch (err) {
    job = {
      key,
      status: "error",
      message: (err && err.message) || "לא הצלחנו להשלים את הייבוא.",
      products: [],
    };
    emit();
  }
}
