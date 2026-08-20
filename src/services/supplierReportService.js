import { api } from "./api";

/*
  supplierReportService — הדוח המפורט שהספק רואה על עצמו.

  ההרשאה היא טוקן העריכה בלבד, כמו בשאר מסכי הספק — אין כאן משתמש מחובר.
  הטווח אופציונלי; בלי טווח השרת מחזיר את השנה האחרונה.
*/

/* תאריך לפורמט שהשרת מצפה לו (YYYY-MM-DD), בלי אזור זמן. */
function toParam(value) {
  if (!value) {
    return null;
  }
  return typeof value === "string" ? value : value.toISOString().slice(0, 10);
}

export function getSupplierReport(token, { from, to } = {}) {
  const params = new URLSearchParams();
  const fromParam = toParam(from);
  const toParamValue = toParam(to);
  if (fromParam) params.set("from", fromParam);
  if (toParamValue) params.set("to", toParamValue);
  const query = params.toString();
  return api.get(
    `/api/public/vendors/${token}/report${query ? `?${query}` : ""}`
  );
}

/*
  טווחים מוכנים מראש. "השנה הקודמת" קיים כדי שההשוואה שנה-מול-שנה תהיה
  לחיצה אחת ולא מילוי ידני של ארבעה שדות — זו הייתה הבקשה המקורית.
  מחזיר תאריכים כמחרוזות YYYY-MM-DD, כדי שיישבו ישירות ב-<input type="date">.
*/
export function presetRanges(today = new Date()) {
  const iso = (d) => d.toISOString().slice(0, 10);
  const daysAgo = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  };

  // שנת פעילות מתחילה בספטמבר ומסתיימת ב-31.8 — כמו שנת הלימודים שהוועדים
  // עובדים לפיה, ולא שנה קלנדרית.
  const year = today.getFullYear();
  const currentStartYear = today.getMonth() >= 8 ? year : year - 1;
  const schoolYear = (startYear) => ({
    from: `${startYear}-09-01`,
    to: `${startYear + 1}-08-31`,
  });

  return [
    { key: "30d", label: "30 יום אחרונים", from: iso(daysAgo(30)), to: iso(today) },
    { key: "90d", label: "3 חודשים אחרונים", from: iso(daysAgo(90)), to: iso(today) },
    {
      key: "thisYear",
      label: `שנת ${currentStartYear}/${String(currentStartYear + 1).slice(2)}`,
      ...schoolYear(currentStartYear),
    },
    {
      key: "lastYear",
      label: `שנת ${currentStartYear - 1}/${String(currentStartYear).slice(2)}`,
      ...schoolYear(currentStartYear - 1),
    },
  ];
}
