import { api } from "./api";

/*
  cardPaymentService — סליקת אשראי דרך ספק חיצוני (שלב 2, צד לקוח).
  פותח תשלום בשרת ומקבל את כתובת עמוד התשלום המאובטח של הספק. במצב סימולטור,
  "עמוד הספק" הוא /pay/return, ואישור שם קורא ל-webhook שמסמן "שולם" — בדיוק
  כמו שספק אמיתי היה עושה. לעולם איננו נוגעים בפרטי הכרטיס.
*/

/* פותח תשלום אשראי לקטגוריה של תלמיד — מחזיר את כתובת עמוד התשלום. */
export async function startCardCheckout(studentId, categoryId) {
  const res = await api.post(
    `/api/students/${studentId}/payments/${categoryId}/card-checkout`
  );
  return res.paymentUrl;
}

/* סימולטור בלבד: מאשר את התשלום המדומה (שולח webhook כמו הספק). */
export async function confirmMockPayment(transactionRef, amount) {
  return api.post("/api/payments/card-webhook", {
    transactionRef,
    success: true,
    amount: Number(amount) || 0,
  });
}
