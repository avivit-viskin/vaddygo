import { api } from "./api";

/*
  giftsService — מתנות הוועד (UI_SPEC ס' 12): שם, אירוע (חג), תקציב, סטטוס,
  וקישור אופציונלי לספק. API-first: כשהשרת זמין עובדים מולו (/api/gifts);
  כשאינו זמין (עוד לא פרוס) נשמר ב-localStorage כדי שהמסך יעבוד כבר עכשיו.
  ⏳ רשומות מקומיות מסומנות isLocal ויסונכרנו כשהבקאנד יעלה לאוויר.
*/
const STORAGE_KEY = "vaadygo.gifts";

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

export async function getGifts() {
  try {
    return await api.get("/api/gifts");
  } catch {
    return readLocal();
  }
}

export async function addGift(gift) {
  try {
    return await api.post("/api/gifts", gift);
  } catch {
    const created = { ...gift, id: Date.now(), isLocal: true };
    writeLocal([...readLocal(), created]);
    return created;
  }
}

export async function updateGift(id, gift) {
  try {
    return await api.put(`/api/gifts/${id}`, gift);
  } catch {
    const list = readLocal().map((g) => (g.id === id ? { ...g, ...gift } : g));
    writeLocal(list);
    return list.find((g) => g.id === id) || null;
  }
}

export async function deleteGift(id) {
  try {
    await api.del(`/api/gifts/${id}`);
  } catch {
    writeLocal(readLocal().filter((g) => g.id !== id));
  }
}
