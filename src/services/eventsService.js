import { api } from "./api";

/*
  eventsService.js — אירועי הגן ללוח השנה.

  מנסה קודם את השרת (‏/api/events); אם אינו זמין — נופל ל-localStorage,
  כך שהלוח עובד גם לפני שהבקאנד פרוס לענן. כשהבקאנד יהיה זמין, אותן
  קריאות ילכו למסד האמיתי בלי לשנות אף מסך.

  שמות השדות זהים למודל Event בשרת: name, eventDate, description,
  location, reminder.
*/

const STORAGE_KEY = "vaadygo.events";

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeLocal(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// ממיר מחרוזת תאריך ("YYYY-MM-DD" או ISO מהשרת) ל-Date מקומי בצהריים
// (יציב מול אזורי זמן — התאריך לא "זז" יום אחורה).
export function parseEventDate(dateString) {
  const [year, month, day] = dateString.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export async function getEvents() {
  try {
    return await api.get("/api/events");
  } catch {
    return readLocal();
  }
}

export async function addEvent({ name, eventDate, description, location, reminder }) {
  const payload = {
    name,
    eventDate,
    description: description || "",
    location: location || "",
    reminder: Boolean(reminder),
  };
  try {
    return await api.post("/api/events", payload);
  } catch {
    const newEvent = { id: Date.now(), ...payload };
    writeLocal([...readLocal(), newEvent]);
    return newEvent;
  }
}

export async function updateEvent(id, { name, eventDate, description, location, reminder }) {
  const payload = {
    name,
    eventDate,
    description: description || "",
    location: location || "",
    reminder: Boolean(reminder),
  };
  try {
    return await api.put(`/api/events/${id}`, payload);
  } catch {
    const updated = readLocal().map((event) =>
      event.id === id ? { ...event, ...payload } : event
    );
    writeLocal(updated);
    return { id, ...payload };
  }
}

export async function deleteEvent(id) {
  try {
    await api.del(`/api/events/${id}`);
  } catch {
    writeLocal(readLocal().filter((event) => event.id !== id));
  }
  return null;
}
