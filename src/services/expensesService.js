import { api } from "./api";

/*
  expensesService — הוצאות הקופה (כסף שיצא). קומפוננטות עוברות רק דרך שכבה זו.
  ההוצאות מקטינות את "יתרת הקופה" ואת קוביות האמצעים במסך הבית (חישוב בשרת).
*/
export function getExpenses() {
  return api.get("/api/expenses");
}

export function createExpense(expense) {
  return api.post("/api/expenses", expense);
}

export function deleteExpense(id) {
  return api.del(`/api/expenses/${id}`);
}

/* סל המיחזור — פריטים שנמחקו ב-30 הימים האחרונים (ניתנים לשחזור). */
export function getTrash() {
  return api.get("/api/expenses/trash");
}

/* שחזור פריט מסל המיחזור חזרה לפעיל. */
export function restoreExpense(id) {
  return api.post(`/api/expenses/${id}/restore`);
}

/* מחיקה לצמיתות של פריט מסל המיחזור (בלתי הפיך). */
export function permanentDeleteExpense(id) {
  return api.del(`/api/expenses/${id}/permanent`);
}

/*
  עדכון הוצאה קיימת. השרת עדיין לא חושף עדכון ישיר (רק POST/DELETE), ולכן
  מממשים כאן "מחיקה + יצירה מחדש" עם הערכים החדשים. הקומפוננטה עוברת דרך
  הפונקציה הזו בלבד — כשייחשף PUT בשרת, נחליף רק את הגוף כאן.
*/
export async function updateExpense(id, expense) {
  await deleteExpense(id);
  // המחיקה היא "רכה" (לסל המיחזור). בעריכה אנחנו מחליפים את הרשומה, ולכן
  // מוחקים את הישנה גם לצמיתות — שלא תישאר גרסה כפולה בסל. כשל כאן אינו קריטי
  // (לכל היותר הישנה תופיע בסל וניתן למחוק אותה ידנית).
  try {
    await permanentDeleteExpense(id);
  } catch {
    /* לא קריטי */
  }
  return createExpense(expense);
}
