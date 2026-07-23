import { api } from "./api";
import { getGroups } from "./groupsService";
import { saveActiveOnboarding, syncServerGroups } from "./institutionsService";

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
    return { synced: true, groupId: group.id };
  } catch {
    persistLocally(data, { syncedWithServer: false });
    return { synced: false, groupId: null };
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

/*
  syncInstitutionsFromServer — מושך את כל הגנים מהשרת (בבעלות המשתמש + כאלה
  שהוזמן אליהם כחבר) ומסנכרן אותם לרשימת המוסדות המקומית, כדי שגם גן שהוזמנת
  אליו יופיע ב-InstitutionSwitcher עם ההרשאה שלו. נקרא אחרי כניסה ואחרי פדיון
  הזמנה. שקט לכשלים (שרת לא זמין → פשוט לא מסנכרן). מחזיר את מספר הגנים.
*/
export async function syncInstitutionsFromServer() {
  let groups;
  try {
    groups = await getGroups();
  } catch {
    return 0;
  }
  if (!Array.isArray(groups)) {
    return 0;
  }
  // מצרפים לכל גן את נתוני ההרשמה שלו (מהשרת) כדי שגן שהוזמנת אליו יישמר עם
  // הכותרת/הקטגוריות שלו, והמעבר אליו יעבוד ויעבור את שער ההרשמה.
  const enriched = groups.map((g) => ({
    ...g,
    onboarding: groupToOnboardingData(g),
  }));
  syncServerGroups(enriched);
  return groups.length;
}

/* ממפה גן מהשרת (GroupResponseDto) בחזרה למבנה נתוני האשף. */
function groupToOnboardingData(group) {
  return {
    ganName: group.name || "",
    city: group.city || "",
    childrenCount: String(group.childrenCount ?? ""),
    staffCount: String(group.staffCount ?? ""),
    hasGroups: Array.isArray(group.subgroups) && group.subgroups.length > 0,
    groups: group.subgroups || [],
    categories: (group.categories || []).map((c) => ({
      name: c.name,
      amount: String(c.amountPerChild ?? ""),
      installments: c.installments ?? 1,
    })),
  };
}

/*
  restoreOnboardingFromServer — משחזר את הגדרת הגן מהשרת כשאין עותק מקומי
  (למשל אחרי החלפת משתמש שניקתה את ה-localStorage). השרת מחזיר אך ורק את
  הגנים של המשתמש המחובר (מאובטח לפי JWT), ולכן זה בטוח ולא דולף.
  מחזיר true אם שוחזר גן, false אם אין למשתמש גן בשרת (משתמש חדש → אשף).
*/
export async function restoreOnboardingFromServer() {
  if (getOnboarding()) {
    return true; // כבר יש הגדרה מקומית — אין צורך לשחזר
  }
  let groups;
  try {
    groups = await getGroups();
  } catch {
    return false;
  }
  if (!Array.isArray(groups) || groups.length === 0) {
    return false;
  }
  const group = groups[0]; // הגן הראשי של המשתמש
  const data = groupToOnboardingData(group);
  persistLocally(data, { groupId: group.id, syncedWithServer: true });
  saveActiveOnboarding(data, group.id); // משחזר גם את המוסד הפעיל (לכותרת ולסינון)
  return true;
}
