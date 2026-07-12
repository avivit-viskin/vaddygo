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
  // קטגוריה נחשבת "שולמה" רק כששולם *כל* היעד (כל התשלומים) — תשלום חלקי
  // (למשל תשלום 1 מתוך 2) עדיין נחשב "טרם שולם", כי נותר לגבות.
  const isFullyPaid = (p) =>
    Number(p.bitAmount) + Number(p.payBoxAmount) + Number(p.cashAmount) >=
    Number(p.amount);
  const paidCount = payments.filter(isFullyPaid).length;
  // התאריך האחרון שבו נרשם תשלום — כדי לדעת מתי לדרוש שוב (מיון ISO = כרונולוגי)
  const paidDates = payments.map((p) => p.paidDate).filter(Boolean).sort();
  return {
    studentId: Number(studentId),
    paidCount,
    totalCount,
    allPaid: totalCount > 0 && paidCount === totalCount,
    hasUnpaid: payments.some((p) => !isFullyPaid(p)),
    lastPaymentDate: paidDates.length ? paidDates[paidDates.length - 1] : null,
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

/* הראש המשותף של הודעת תשלום: ברכה, פירוט הקטגוריות שטרם שולמו, וסכום כולל. */
function reminderHead(studentFullName, unpaidPayments) {
  const lines = unpaidPayments.map((p) => `• ${p.categoryName}: ${formatShekels(p.amount)}`);
  const total = unpaidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  return [
    "שלום 🙂",
    `תזכורת ידידותית מהוועד לתשלומים עבור ${studentFullName}:`,
    ...lines,
    `סה"כ לתשלום: ${formatShekels(total)}`,
  ];
}

/* הודעת תזכורת ידידותית עם פירוט הקטגוריות שטרם שולמו והסכום הכולל. */
export function buildReminderMessage(studentFullName, unpaidPayments) {
  return [...reminderHead(studentFullName, unpaidPayments), "תודה רבה! 💜"].join("\n");
}

/*
  הודעת בקשת תשלום לפי אמצעי: לביט/פייבוקס מצורף קישור התשלום של הוועד;
  למזומן (או כשאין קישור) — תזכורת להסדרת התשלום בלבד. ההודעה נשלחת להורה בוואטסאפ.
*/
export function buildPaymentRequestMessage(studentFullName, unpaidPayments, method, links) {
  const head = reminderHead(studentFullName, unpaidPayments);
  let tail;
  if (method === "bit" && links?.bit) {
    tail = [`לתשלום מהיר בביט: ${links.bit}`, "תודה רבה! 💜"];
  } else if (method === "paybox" && links?.paybox) {
    tail = [`לתשלום דרך פייבוקס: ${links.paybox}`, "תודה רבה! 💜"];
  } else {
    tail = ["נא להסדיר את התשלום בהקדם, תודה! 💜"];
  }
  return [...head, "", ...tail].join("\n");
}
