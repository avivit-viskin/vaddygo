/*
  paymentsService — תשלומי תלמיד לפי קטגוריות גבייה (שלב 5).
  קומפוננטות לא קוראות ל-api ישירות — רק דרך שכבת ה-service.
*/

import { api } from "./api";
import { formatShekels } from "./format";

export function getStudentPayments(studentId) {
  return api.get(`/api/students/${studentId}/payments`);
}

export function saveStudentPayment(studentId, categoryId, payment) {
  return api.put(`/api/students/${studentId}/payments/${categoryId}`, payment);
}

/*
  סיכום מצב התשלומים של תלמיד (כמה קטגוריות שולמו מתוך הכל), לתצוגת תג
  ברשימת התלמידים. ⏳ כרגע קריאה אחת לתלמיד; אם מספר התלמידים יגדל מאוד
  כדאי endpoint סיכום מרוכז בשרת (`GET /api/students/payments-summary`).
*/
export async function getPaymentSummary(studentId) {
  const payments = await getStudentPayments(studentId);
  const totalCount = payments.length;
  const paidCount = payments.filter((p) => p.isPaid).length;
  return {
    studentId: Number(studentId),
    paidCount,
    totalCount,
    allPaid: totalCount > 0 && paidCount === totalCount,
    hasUnpaid: payments.some((p) => !p.isPaid),
  };
}

/*
  בונה קישור וואטסאפ עם הודעת תזכורת מוכנה. פותח את וואטסאפ עם ההודעה
  כבר מוקלדת — הוועד רק לוחץ "שלח". בלי סליקה בתוך המערכת (UI_SPEC ס' 15).
*/
export function buildWhatsappReminderUrl(parentPhone, message) {
  return `https://wa.me/${toInternationalPhone(parentPhone)}?text=${encodeURIComponent(message)}`;
}

/* 05X-XXXXXXX ← 9725XXXXXXXX (וואטסאפ דורש קידומת מדינה בלי אפס מוביל) */
function toInternationalPhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.startsWith("0") ? `972${digits.slice(1)}` : digits;
}

/* הודעת תזכורת ידידותית עם פירוט הקטגוריות שטרם שולמו והסכום הכולל. */
export function buildReminderMessage(studentFullName, unpaidPayments) {
  const lines = unpaidPayments.map((p) => `• ${p.categoryName}: ${formatShekels(p.amount)}`);
  const total = unpaidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  return [
    "שלום 🙂",
    `תזכורת ידידותית מהוועד לתשלומים עבור ${studentFullName}:`,
    ...lines,
    `סה"כ לתשלום: ${formatShekels(total)}`,
    "תודה רבה! 💜",
  ].join("\n");
}
