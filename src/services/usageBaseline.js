/*
  usageBaseline — "איפוס תצוגה" של דוח השימוש, בצד המנהלת בלבד (localStorage,
  בדפדפן שלה). לא נוגע בנתונים בשרת ולא מוחק אף חשבון: שומר צילום של המספרים
  הנוכחיים כ"קו בסיס", והדוח מציג מכאן והלאה רק את מה שנוסף מעל הקו. כך
  "51 ועדים" הופך ל-0 בתצוגה, בלי למחוק את מי שנרשם. פר-משפך (committees/suppliers).
*/
const KEY = (funnelKey) => `vaadygo.usage.baseline.${funnelKey}`;

export function getBaseline(funnelKey) {
  try {
    const raw = localStorage.getItem(KEY(funnelKey));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setBaseline(funnelKey, funnel) {
  const snapshot = {
    registered: funnel?.registered || 0,
    completed: funnel?.completed || 0,
    registeredLast5Days: funnel?.registeredLast5Days || 0,
    registeredLast30Days: funnel?.registeredLast30Days || 0,
    at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY(funnelKey), JSON.stringify(snapshot));
  } catch {
    /* אחסון חסום/מלא — פשוט לא שומרים */
  }
  return snapshot;
}

export function clearBaseline(funnelKey) {
  try {
    localStorage.removeItem(KEY(funnelKey));
  } catch {
    /* אין מה לעשות */
  }
}

/*
  מחזיר משפך מתוקן: המספרים הנוכחיים פחות קו-הבסיס (לא יורד מתחת ל-0). אם אין
  קו-בסיס — מחזיר את המשפך כמו שהוא. "נעצרו" מחושב מחדש מהמתוקנים כדי להישאר עקבי.
*/
export function applyBaseline(funnel, base) {
  if (!funnel || !base) {
    return funnel;
  }
  const registered = Math.max(0, (funnel.registered || 0) - (base.registered || 0));
  const completed = Math.max(0, (funnel.completed || 0) - (base.completed || 0));
  return {
    registered,
    completed,
    stopped: Math.max(0, registered - completed),
    registeredLast5Days: Math.max(
      0,
      (funnel.registeredLast5Days || 0) - (base.registeredLast5Days || 0)
    ),
    registeredLast30Days: Math.max(
      0,
      (funnel.registeredLast30Days || 0) - (base.registeredLast30Days || 0)
    ),
  };
}
