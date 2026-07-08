/*
  eventsService.js — אירועי הגן ללוח השנה.

  שמות השדות זהים למודל Event בשרת (name, eventDate, description, location)
  בתוספת reminder (יתווסף לשרת במשימת צד-השרת של שלב 6).

  ⏳ זמני: עד שקיים endpoint‏ /api/events בשרת, האירועים נשמרים ב-localStorage
  של הדפדפן. הפונקציות אסינכרוניות בכוונה — כשה-API יהיה מוכן מחליפים רק
  את הגוף שלהן בקריאות api.get/post/del, בלי לשנות אף מסך.
*/

const STORAGE_KEY = "vaadygo.events";

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeAll(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// ממיר מחרוזת תאריך "YYYY-MM-DD" ל-Date מקומי בצהריים (יציב מול אזורי זמן)
export function parseEventDate(dateString) {
  const [year, month, day] = dateString.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export async function getEvents() {
  return readAll();
}

export async function addEvent({ name, eventDate, description, location, reminder }) {
  const events = readAll();
  const newEvent = {
    id: Date.now(),
    name,
    eventDate,
    description: description || "",
    location: location || "",
    reminder: Boolean(reminder),
  };
  writeAll([...events, newEvent]);
  return newEvent;
}

export async function deleteEvent(id) {
  writeAll(readAll().filter((event) => event.id !== id));
  return null;
}
