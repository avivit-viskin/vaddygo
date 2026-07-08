import { api } from "./api";

/*
  onboardingService — שמירת הגדרות הגן מאשף ההרשמה.
  שולח את הגן לשרת (POST /api/groups) ושומר עותק ב-localStorage;
  אם השרת לא זמין — נשמר מקומית בלבד (syncedWithServer=false) והמשתמשת
  ממשיכה לעבוד. סנכרון חוזר יטופל כשתיבנה תכונת "נסי שוב".
*/
const STORAGE_KEY = "vaadygo.onboarding";

/* ממפה את נתוני האשף למבנה שה-API מצפה לו (GroupCreateDto) */
function toGroupPayload(data) {
  return {
    name: data.ganName.trim(),
    city: data.city.trim(),
    childrenCount: Number(data.childrenCount) || 0,
    staffCount: Number(data.staffCount) || 0,
    subgroups: data.hasGroups ? data.groups : [],
    categories: data.categories
      .filter((c) => Number(c.amount) > 0)
      .map((c) => ({
        name: c.name.replace(" (אופציונלי)", ""),
        amountPerChild: Number(c.amount),
        installments: c.installments,
      })),
  };
}

function persistLocally(data, extra) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...data, ...extra, completedAt: new Date().toISOString() })
  );
}

export async function saveOnboarding(data) {
  try {
    const group = await api.post("/api/groups", toGroupPayload(data));
    persistLocally(data, { groupId: group.id, syncedWithServer: true });
    return { synced: true };
  } catch {
    persistLocally(data, { syncedWithServer: false });
    return { synced: false };
  }
}

export function getOnboarding() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isOnboardingComplete() {
  return getOnboarding() !== null;
}
