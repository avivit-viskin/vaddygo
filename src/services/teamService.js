import { api } from "./api";

/*
  teamService — ניהול חברי הצוות וההרשאות של המוסד הפעיל מול ה-API האמיתי
  (/api/team). ההצטרפות היא בקישור הזמנה עם טוקן חד-פעמי: מנהל יוצר הזמנה,
  שולח את הקישור (וואטסאפ/מייל), והמוזמן פודה אותו בעמוד /join ומצטרף כחבר
  עם ההרשאה שנבחרה. האכיפה עצמה בשרת (צופה = 403 על כל כתיבה).
*/

// שלוש רמות ההרשאה (מוצגות למשתמש עם אייקון ותיאור)
export const ROLES = [
  { value: "viewer", label: "צופה", icon: "👀", desc: "צפייה בלבד — בלי לערוך" },
  { value: "editor", label: "עורך", icon: "✏️", desc: "צפייה ועריכה של הנתונים" },
  { value: "manager", label: "מנהל", icon: "⭐", desc: "הכול — כולל הזמנה ומחיקה של משתמשים" },
];

export function roleLabel(value) {
  return ROLES.find((r) => r.value === value)?.label || value;
}

/*
  חברי הצוות + ההזמנות הממתינות של המוסד הפעיל.
  מחזיר { members: [{id, userId, username, role}], pendingInvites: [{id, token, role, inviteeName}], canManage }.
  (X-Institution של המוסד הפעיל נשלח אוטומטית ב-api.js.)
*/
export function getTeam() {
  return api.get("/api/team");
}

/* יצירת הזמנה חדשה (מנהל בלבד) — מחזיר { id, token, role, inviteeName } לבניית הקישור. */
export function createInvite(role, name) {
  return api.post("/api/team/invites", { role, name });
}

/* ביטול הזמנה ממתינה (מנהל בלבד). */
export function cancelInvite(inviteId) {
  return api.del(`/api/team/invites/${inviteId}`);
}

/* הסרת חבר צוות (מנהל בלבד). */
export function removeMember(memberId) {
  return api.del(`/api/team/members/${memberId}`);
}

/* שינוי הרשאת חבר צוות (מנהל בלבד). */
export function updateMemberRole(memberId, role) {
  return api.put(`/api/team/members/${memberId}`, { role });
}

/* תצוגה מקדימה של הזמנה לפי טוקן (עמוד ההצטרפות) — { ganName, role, alreadyMember }. */
export function previewInvite(token) {
  return api.get(`/api/team/invite/${encodeURIComponent(token)}`);
}

/* המשתמש המחובר פודה את הטוקן ומצטרף לגן עם ההרשאה שבהזמנה. */
export function acceptInvite(token) {
  return api.post(`/api/team/invite/${encodeURIComponent(token)}/accept`);
}

/* בונה את קישור ההזמנה המלא לשיתוף (וואטסאפ/מייל). */
export function inviteLink(token) {
  return `${window.location.origin}/join/${token}`;
}
