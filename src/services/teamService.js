import { getActiveInstitution } from "./institutionsService";

/*
  teamService — ניהול המשתמשים המורשים של המוסד (משימה 6, שלב "מסכים בלבד").
  כרגע נשמר מקומית לכל מוסד בנפרד; חיבור אמיתי של הרשאות (שרת) יגיע בשלב הבא.
*/

// שלוש רמות ההרשאה מהעיצוב של בעלת המוצר
export const ROLES = [
  { value: "viewer", label: "צופה", icon: "👀", desc: "יכולה לצפות בלבד — בלי לערוך" },
  { value: "editor", label: "עורך", icon: "✏️", desc: "יכולה לצפות ולערוך נתונים" },
  { value: "manager", label: "מנהל", icon: "⭐", desc: "יכולה הכל — כולל להזמין ולמחוק משתמשים" },
];

export function roleLabel(value) {
  return ROLES.find((r) => r.value === value)?.label || value;
}

function storageKey() {
  const inst = getActiveInstitution();
  return `vaadygo.team.${inst?.id ?? "default"}`;
}

export function getTeam() {
  try {
    return JSON.parse(localStorage.getItem(storageKey())) || [];
  } catch {
    return [];
  }
}

export function addTeamMember({ name, contact, role }) {
  const entry = {
    id: `m-${Date.now()}`,
    name: (name || "").trim(),
    contact: (contact || "").trim(),
    role: role || "viewer",
  };
  const next = [...getTeam(), entry];
  localStorage.setItem(storageKey(), JSON.stringify(next));
  return entry;
}

export function removeTeamMember(id) {
  const next = getTeam().filter((m) => m.id !== id);
  localStorage.setItem(storageKey(), JSON.stringify(next));
  return next;
}
