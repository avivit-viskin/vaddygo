/*
  shabbatParents — עזרי "אבא/אמא של שבת": גזירת התפקיד לפי מין הילד/ה, בניית
  הודעת הוואטסאפ להורה, ושמירת התפקיד לכל אירוע. התפקיד (dad/mom) נגזר מהילד/ה
  שנבחר/ה, ונשמר מקומית לכל מזהה אירוע (שדה המין בתלמיד אינו חובה, ולכן אפשר גם
  לבחור ידנית). טלפון ההורה עצמו נשמר בשרת יחד עם האירוע.
*/
import { whatsappUrl } from "./whatsapp";

const KEY = "vaadygo.shabbatParents";

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // אחסון מלא/חסום — לא קריטי, פשוט לא נשמר
  }
}

/* המידע ששמור לאירוע: { role: "dad"|"mom", studentId }. */
export function getShabbatInfo(eventId) {
  return readAll()[String(eventId)] || null;
}

export function setShabbatInfo(eventId, info) {
  const map = readAll();
  if (info && info.role) {
    map[String(eventId)] = { role: info.role, studentId: info.studentId ?? null };
  } else {
    delete map[String(eventId)];
  }
  writeAll(map);
}

/*
  גזירת התפקיד ממין הילד/ה (שדה חופשי ולא חובה): בן/זכר → אבא, בת/נקבה → אמא.
  אם לא ברור — מחזיר null (ואז בוחרים ידנית בטופס).
*/
export function roleFromGender(gender) {
  const g = (gender || "").trim();
  if (!g) return null;
  if (g.startsWith("בן") || g.includes("זכר") || /^(ז|m|male|boy)$/i.test(g)) {
    return "dad";
  }
  if (g.startsWith("בת") || g.includes("נקבה") || /^(נ|f|female|girl)$/i.test(g)) {
    return "mom";
  }
  return null;
}

export function roleLabel(role) {
  return role === "mom" ? "אמא של שבת" : "אבא של שבת";
}

/*
  הודעת הוואטסאפ להורה: "בנכם/בתכם נבחר/ה להיות אבא/אמא של שבת", מה להביא, ותודה.
  התפקיד קובע גם את בן/בת וגם את ההטיה (נבחר/נבחרה).
*/
export function shabbatParentMessage(event, ganName) {
  const role = event.shabbatRole === "mom" ? "mom" : "dad";
  const child = role === "mom" ? "בתכם נבחרה" : "בנכם נבחר";
  let msg = `שלום 🙂 ${child} להיות ${roleLabel(role)}!`;
  if (event.whatToBring) {
    msg += ` נא להביא: ${event.whatToBring}.`;
  }
  msg += ` תודה על שיתוף הפעולה 🌸 גן ${ganName || ""}`;
  return msg.trim();
}

export function shabbatWhatsappUrl(event, ganName) {
  const message = shabbatParentMessage(event, ganName);
  return `${whatsappUrl(event.parentPhone)}?text=${encodeURIComponent(message)}`;
}
