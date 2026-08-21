import { api } from "./api";

/*
  subscriptionsService — תמונת המנויים של VaddyGo (מנהלת בלבד): מי במסלול פרו,
  עד מתי, ומי עומד לפוג. כמו נתוני השימוש — בלי נפילה מקומית, כי מספר מומצא
  בדפדפן יטעה בהחלטה עסקית על כסף.
*/
export async function getSubscriptions() {
  return api.get("/api/admin/subscriptions");
}

/*
  מחיקת גן (ניקוי גני-בדיקה) — למנהלת בלבד. השרת מוחק רק גן יחיד של חשבון רגיל,
  ומסרב לחשבון מנהלת או לחשבון עם כמה גנים (בטיחות מפני מחיקה בטעות/נעילה-עצמית).
*/
export async function deleteCommittee(groupId) {
  return api.del(`/api/admin/committees/${groupId}`);
}

/*
  פתיחה/סגירה ידנית של מסלול פרו לגן — למנהלת בלבד.

  עד עכשיו פרו לוועד נפתח רק אוטומטית אחרי תשלום, ולא הייתה שום דרך לתת אותו
  ידנית (גן פיילוט, לקוחה שמשלמת בהעברה, או בדיקה). ‏months ריק = שנה, כמו
  מנוי בתשלום. הפעולה היא לגן יחיד — פרו הוא per-gan, ולחשבון אחד יכולים
  להיות כמה גנים.
*/
export async function setCommitteePro(groupId, isPro, months) {
  return api.put(`/api/admin/committees/${groupId}/pro`, { isPro, months });
}

/* תווית עברית + צבע לסטטוס שהשרת מחזיר. מקור אחד לכל המסך. */
const STATUS_LABELS = {
  active: { label: "מנוי פעיל", tone: "good" },
  expiring: { label: "פג בקרוב", tone: "warn" },
  expired: { label: "פג", tone: "bad" },
  free: { label: "לא מנוי", tone: "muted" },
};

export function subscriptionStatus(status) {
  return STATUS_LABELS[status] || STATUS_LABELS.free;
}

/*
  תיאור התוקף בשפה של בעלת המוצר. מנוי בלי תאריך = פתיחה ידנית שלה, ולכן
  נאמר זאת במפורש במקום להציג "—" מסתורי.
*/
export function validUntilText(row) {
  if (!row?.isPro) {
    return "—";
  }
  if (!row.validUntil) {
    return "ללא תאריך תפוגה";
  }
  let date = "";
  try {
    date = new Date(row.validUntil).toLocaleDateString("he-IL");
  } catch {
    date = "";
  }
  if (row.daysLeft == null) {
    return date;
  }
  if (row.daysLeft < 0) {
    return `${date} (פג)`;
  }
  return `${date} (עוד ${row.daysLeft} ימים)`;
}
