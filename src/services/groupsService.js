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
  עדכון מספר הילדים בגן — משפיע על היעד/החוב במסך הבית. מחזיר את הגן המעודכן.
*/
export function updateChildrenCount(groupId, childrenCount) {
  return api.put(`/api/groups/${groupId}/children-count`, { childrenCount });
}

/*
  עדכון הערת האלרגיות הכללית של המוסד — מוצגת באדום ברשימת התלמידים לכל חברות
  הוועד. טקסט חופשי; ריק = הסרת ההערה. מאפשר גם למוסדות קיימים (שכבר סיימו אשף)
  להוסיף/לעדכן אותה. מחזיר את הגן המעודכן.
*/
export function updateAllergiesNote(groupId, allergiesNote) {
  return api.put(`/api/groups/${groupId}/allergies-note`, { allergiesNote });
}

/*
  עדכון החלוקה לקבוצות של הגן: לכל קבוצה שם + סכום גבייה אופציונלי (0/ריק =
  סכום הקטגוריות הרגיל). מקבל מערך של { name, amount } ומחזיר את הגן המעודכן.
*/
export function updateSubgroups(groupId, groups) {
  const payload = (groups || []).map((g) => ({
    name: (g.name || "").trim(),
    amount:
      g.amount === "" || g.amount == null || Number.isNaN(Number(g.amount))
        ? null
        : Number(g.amount),
  }));
  return api.put(`/api/groups/${groupId}/subgroups`, { groups: payload });
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
