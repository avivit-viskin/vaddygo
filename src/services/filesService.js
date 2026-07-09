import { api } from "./api";

/*
  filesService — קישורי תיקיות Google Drive (UI_SPEC ס' 13): שם + קישור שיתוף.
  API-first עם נפילה חיננית ל-localStorage כשהשרת לא זמין, כמו שאר השירותים.
*/
const STORAGE_KEY = "vaadygo.folders";

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

export async function getFolders() {
  try {
    return await api.get("/api/folders");
  } catch {
    return readLocal();
  }
}

export async function addFolder(folder) {
  try {
    return await api.post("/api/folders", folder);
  } catch {
    const created = { ...folder, id: Date.now(), isLocal: true };
    writeLocal([...readLocal(), created]);
    return created;
  }
}

export async function updateFolder(id, folder) {
  try {
    return await api.put(`/api/folders/${id}`, folder);
  } catch {
    const list = readLocal().map((f) => (f.id === id ? { ...f, ...folder } : f));
    writeLocal(list);
    return list.find((f) => f.id === id) || null;
  }
}

export async function deleteFolder(id) {
  try {
    await api.del(`/api/folders/${id}`);
  } catch {
    writeLocal(readLocal().filter((f) => f.id !== id));
  }
}
