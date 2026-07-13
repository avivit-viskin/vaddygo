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
