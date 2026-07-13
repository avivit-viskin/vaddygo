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

/*
  עדכון הוצאה קיימת. השרת עדיין לא חושף עדכון ישיר (רק POST/DELETE), ולכן
  מממשים כאן "מחיקה + יצירה מחדש" עם הערכים החדשים. הקומפוננטה עוברת דרך
  הפונקציה הזו בלבד — כשייחשף PUT בשרת, נחליף רק את הגוף כאן.
*/
export async function updateExpense(id, expense) {
  await deleteExpense(id);
  return createExpense(expense);
}
