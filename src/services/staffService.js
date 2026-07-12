import { api } from "./api";

/*
  staffService — אנשי הצוות של הגן (UI_SPEC ס' 8: רשימה, הוספה, עריכה).
  API-first: כשהשרת זמין עובדים מולו (/api/staff); כשאינו זמין (עוד לא פרוס) —
  הרשימה נשמרת ב-localStorage כדי שמסך הבית יעבוד כבר עכשיו.
  ⏳ רשומות שנוצרו מקומית יסונכרנו לשרת כשהבקאנד יעלה לאוויר (שלב 0).
*/
const STORAGE_KEY = "vaadygo.staff";

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeLocal(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* מפתח זהות לאיש צוות (שם + תאריך לידה) — למניעת כפילויות במיזוג. */
function staffKey(m) {
  return `${(m.fullName || "").trim()}|${String(m.birthDate || "").slice(0, 10)}`;
}

export async function getStaff() {
  const local = readLocal().filter((m) => m.isLocal);
  try {
    const server = await api.get("/api/staff");
    if (local.length === 0) {
      return server;
    }
    // אנשי צוות שנשמרו מקומית (כשההוספה לשרת נכשלה) ועדיין לא קיימים בשרת —
    // מציגים גם אותם, כדי שהוספה לא "תיעלם" כשהשרת מחזיר רשימה בלעדיהם.
    const seen = new Set(server.map(staffKey));
    const stillLocal = [];
    for (const m of local) {
      const key = staffKey(m);
      if (!seen.has(key)) {
        seen.add(key);
        stillLocal.push(m);
      }
    }
    return [...server, ...stillLocal];
  } catch {
    return readLocal();
  }
}

export async function addStaffMember(member) {
  try {
    return await api.post("/api/staff", member);
  } catch {
    const created = { ...member, id: Date.now(), isLocal: true };
    writeLocal([...readLocal(), created]);
    return created;
  }
}

export async function updateStaffMember(id, member) {
  try {
    return await api.put(`/api/staff/${id}`, member);
  } catch {
    const list = readLocal().map((m) => (m.id === id ? { ...m, ...member } : m));
    writeLocal(list);
    return list.find((m) => m.id === id) || null;
  }
}

/*
  מחיקת איש צוות. רשומה שנשמרה מקומית (isLocal) נמחקת מ-localStorage בלבד;
  רשומת שרת נמחקת בשרת — ושגיאה נזרקת הלאה כדי שתוצג למשתמשת בדיאלוג.
*/
export async function deleteStaffMember(id) {
  const local = readLocal();
  if (local.some((m) => m.id === id)) {
    writeLocal(local.filter((m) => m.id !== id));
    return;
  }
  await api.del(`/api/staff/${id}`);
}

/*
  מתי יחול יום ההולדת הבא (השנה או בשנה הבאה) — לחישוב מקומי כשאין שרת.
  מטפל גם ב-29.2 בשנה לא מעוברת (נופל ל-28.2), כמו בשרת.
*/
export function nextBirthday(birthDateIso, today = new Date()) {
  const birth = new Date(birthDateIso);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const inYear = (year) => {
    const lastDay = new Date(year, birth.getMonth() + 1, 0).getDate();
    return new Date(year, birth.getMonth(), Math.min(birth.getDate(), lastDay));
  };

  const thisYear = inYear(startOfToday.getFullYear());
  return thisYear >= startOfToday ? thisYear : inYear(startOfToday.getFullYear() + 1);
}
