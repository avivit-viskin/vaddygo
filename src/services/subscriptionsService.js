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
  active: { label: "מנוי בתשלום", tone: "good" },
  // פרו שניתן במסגרת המבצע — נבדל מהמשלמים בכוונה, כדי שאפשר יהיה לראות
  // בבת אחת מי נהנה מהפיצ'רים ומי באמת מכניס כסף.
  trial: { label: "פרו ללא עלות", tone: "info" },
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

/*
  שליחת עדכון לכל בעלי המוסדות (מייל) — למנהלת בלבד.

  זהו ערוץ העדכון היחיד שמגיע לכולם: מספרי וואטסאפ אינם נשמרים במערכת,
  ולכן אי אפשר לשלוח לכולם בוואטסאפ. הנוסח נשלח מהמסך ולא מקובע בשרת,
  כדי שעדכון חדש לא ידרוש פריסה.
*/
export function getBroadcastRecipients() {
  return api.get("/api/admin/broadcast/recipients");
}

export function sendBroadcast({ subject, body }) {
  return api.post("/api/admin/broadcast", { subject, body });
}

/*
  נוסח ברירת המחדל — אותו מסר שאושר לוואטסאפ, מותאם למייל (בלי הכוכביות
  שמסמנות הדגשה בוואטסאפ ואינן אומרות כלום במייל).
*/
export const PRO_ANNOUNCEMENT = {
  subject: "מסלול הפרו של VaddyGo פתוח לכם ללא עלות עד 1.10",
  body: [
    "היי 🙂",
    "",
    "רצינו לעדכן — מסלול הפרו של VaddyGo פתוח לכם ללא עלות עד 1.10.",
    "",
    "כלומר עד אז זמינים לכם כל הפיצ'רים המתקדמים:",
    "• סקרים להורים",
    "• עוזרת AI לניסוח הודעות",
    "• ניהול חברי ועד והרשאות",
    "• דוחות מורחבים",
    "",
    "מה קורה ב-1.10?",
    "המערכת ממשיכה לעבוד כרגיל במסלול החינמי — הגבייה, התלמידים, התשלומים",
    "וההוצאות נשארים פתוחים. רק הפיצ'רים המתקדמים ננעלים.",
    "",
    "וחשוב: כל מה שיצרתם נשמר במערכת. שום דבר לא נמחק.",
    "",
    "מי שירצה להמשיך עם הפרו — 149 ₪ לשנה.",
    "",
    "כל שאלה, אנחנו כאן 💗",
    "צוות VaddyGo",
  ].join("\n"),
};
