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

export async function getStaff() {
  try {
    return await api.get("/api/staff");
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
