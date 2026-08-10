/*
  groupsService — קריאות שקשורות לגן (Group) וקטגוריות הגבייה שלו.
  קומפוננטות לא קוראות ל-api ישירות — רק דרך שכבת ה-service.
*/

import { api } from "./api";

export function getGroups() {
  return api.get("/api/groups");
}

/*
  עדכון קטגוריות הגבייה של גן קיים (מסך "עריכת גבייה") — מחליף את כל הרשימה.
  categories: [{ name, amountPerChild, installments }]
*/
export function updateGroupCategories(groupId, categories) {
  return api.put(`/api/groups/${groupId}/categories`, { categories });
}

/*
  שינוי שם הגן בשרת (Group.Name) — לתיקון טעות הקלדה. השרת מאמת בעלות
  (רק הבעלים יכול לשנות את הגן שלו). נשמר גם בשרת כדי שהשם החדש יחזור נכון
  אחרי ניקוי דפדפן או כניסה ממכשיר אחר.
*/
export function renameGroup(groupId, name) {
  return api.put(`/api/groups/${groupId}/name`, { name });
}

/*
  מחיקת מוסד (Group) וכל הנתונים שלו מהשרת — רק המוסד הזה, לא החשבון ולא
  מוסדות אחרים. השרת מאמת בעלות (רק הבעלים יכול למחוק את הגן שלו).
*/
export function deleteGroup(groupId) {
  return api.del(`/api/groups/${groupId}`);
}

/*
  פתיחה/סגירה של מסלול פרו למוסד — **מנהלת VaddyGo בלבד** (השרת אוכף ומחזיר
  403 לכל אחת אחרת). זהו מקור האמת לפרו: מכאן הוא חל בכל מכשיר ובכל דפדפן,
  והשרת חוסם בפועל את פיצ'רי הפרו למוסד שאינו מנוי.
  validUntil: תאריך ISO או null (בלי תאריך תפוגה).
*/
export function setGroupPro(groupId, isPro, validUntil = null) {
  return api.put(`/api/groups/${groupId}/pro`, { isPro, validUntil });
}
