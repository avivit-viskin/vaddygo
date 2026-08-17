import { api } from "./api";

/*
  securityStatusService — אילו הגנות פעילות בפועל בשרת (מנהלת בלבד).
  מחזיר דגלים בלבד; המפתחות עצמם לעולם אינם עוזבים את השרת.
*/
export async function getSecurityStatus() {
  return api.get("/api/admin/security");
}
