import { api } from "./api";

/*
  vendorsService — ספקי הוועד (UI_SPEC ס' 12): שם, קישור לקטלוג, ומוצרים
  (שם + מחיר). בלחיצה על ספק במסך המתנות נפתח דף עם המוצרים והקטלוג.
  API-first עם נפילה חיננית ל-localStorage, כמו שאר השירותים.
*/
const STORAGE_KEY = "vaadygo.vendors";

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

export async function getVendors() {
  try {
    return await api.get("/api/vendors");
  } catch {
    return readLocal();
  }
}

export async function addVendor(vendor) {
  try {
    return await api.post("/api/vendors", vendor);
  } catch {
    const created = { ...vendor, id: Date.now(), isLocal: true };
    writeLocal([...readLocal(), created]);
    return created;
  }
}

export async function updateVendor(id, vendor) {
  try {
    return await api.put(`/api/vendors/${id}`, vendor);
  } catch {
    const list = readLocal().map((v) => (v.id === id ? { ...v, ...vendor } : v));
    writeLocal(list);
    return list.find((v) => v.id === id) || null;
  }
}

export async function deleteVendor(id) {
  try {
    await api.del(`/api/vendors/${id}`);
  } catch {
    writeLocal(readLocal().filter((v) => v.id !== id));
  }
}
