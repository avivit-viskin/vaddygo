import { api } from "./api";

/*
  securityStatusService — אילו הגנות פעילות בפועל בשרת (מנהלת בלבד).
  מחזיר דגלים בלבד; המפתחות עצמם לעולם אינם עוזבים את השרת.
*/
export async function getSecurityStatus() {
  return api.get("/api/admin/security");
}

/*
  מצפין רשומות שנשמרו לפני הפעלת ההצפנה. אידמפוטנטי — ערך שכבר מוצפן מדולג,
  ולכן אפשר להריץ שוב בלי חשש. מחזיר { updated }.
*/
export async function encryptExistingRecords() {
  return api.post("/api/admin/encrypt-existing");
}
