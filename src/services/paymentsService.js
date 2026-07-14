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
  כמה שולם בפועל בקטגוריה — סכום כל אמצעי התשלום (ביט + פייבוקס + מזומן).
  סכום חסר/לא-מספרי נספר כ-0 (עמידות מפני שדה שלא הוחזר מהשרת).
*/
export function amountPaidSoFar(payment) {
  return (
    (Number(payment.bitAmount) || 0) +
    (Number(payment.payBoxAmount) || 0) +
    (Number(payment.cashAmount) || 0)
  );
}

/*
  האם הקטגוריה שולמה *במלואה*. קטגוריה עם יעד סכום (amount>0) "שולמה" רק
  כשסכום האמצעים מכסה את היעד — תשלום *חלקי* (למשל 200 מתוך 300) עדיין נחשב
  "טרם שולם". לקטגוריה בלי יעד סכום (0) אי אפשר לחשב "כמה נשאר", ולכן נשענים
  על דגל התשלום (isPaid). ⚠️ לא נשענים על isPaid כשיש יעד — הוא נדלק גם על
  תשלום חלקי, ואז היה נראה בטעות "כל התשלומים שולמו".
*/
export function isCategoryFullyPaid(payment) {
  const target = Number(payment.amount) || 0;
  return target > 0 ? amountPaidSoFar(payment) >= target : Boolean(payment.isPaid);
}

/* כמה עוד נותר לגבות בקטגוריה (יעד פחות מה ששולם, לא פחות מ-0). */
export function amountRemaining(payment) {
  const target = Number(payment.amount) || 0;
  return target > 0 ? Math.max(0, target - amountPaidSoFar(payment)) : target;
}

/*
  סיכום מצב התשלומים של תלמיד (כמה קטגוריות שולמו מתוך הכל), לתצוגת תג
  ברשימת התלמידים. ⏳ כרגע קריאה אחת לתלמיד; אם מספר התלמידים יגדל מאוד
  כדאי endpoint סיכום מרוכז בשרת (`GET /api/students/payments-summary`).
*/
export async function getPaymentSummary(studentId) {
  const payments = await getStudentPayments(studentId);
  const totalCount = payments.length;
  const paidCount = payments.filter(isCategoryFullyPaid).length;
  // התאריך האחרון שבו נרשם תשלום — כדי לדעת מתי לדרוש שוב (מיון ISO = כרונולוגי)
  const paidDates = payments.map((p) => p.paidDate).filter(Boolean).sort();
  return {
    studentId: Number(studentId),
    paidCount,
    totalCount,
    allPaid: totalCount > 0 && paidCount === totalCount,
    hasUnpaid: payments.some((p) => !isCategoryFullyPaid(p)),
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

/*
  קישור "שיתוף בוואטסאפ" בלי נמען מוגדר מראש — וואטסאפ נפתח עם ההודעה מוכנה
  ומאפשר לבחור למי לשלוח (למשל קבוצת ההורים), בלי לצאת ולהיכנס לכל הורה בנפרד.
*/
export function buildWhatsappShareUrl(message) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/* 05X-XXXXXXX ← 9725XXXXXXXX (וואטסאפ דורש קידומת מדינה בלי אפס מוביל) */
function toInternationalPhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.startsWith("0") ? `972${digits.slice(1)}` : digits;
}

/*
  הראש המשותף של הודעת תשלום: נוסח אישי ידידותי עם שם הילד, ואז "תזכורת
  תשלומים" עם פירוט הקטגוריות שטרם שולמו והסכום הכולל.
*/
function reminderHead(studentFullName, unpaidPayments) {
  // מציגים את מה ש*נותר* לגבות בכל קטגוריה (יעד פחות מה ששולם) — כך תשלום
  // חלקי לא מוצג כאילו נותר הסכום המלא.
  const lines = unpaidPayments.map(
    (p) => `• ${p.categoryName}: ${formatShekels(amountRemaining(p))}`
  );
  const total = unpaidPayments.reduce((sum, p) => sum + amountRemaining(p), 0);
  return [
    "היי 😊",
    `אנחנו עושים מעבר על יתרות כספי הוועד, ולפי הרישומים שלנו נותר תשלום עבור ${studentFullName}.`,
    "נשמח אם תוכלי להסדיר את התשלום בהקדם, כדי שנוכל להמשיך בניהול הפעילות השוטפת של הוועד.",
    "תודה רבה על שיתוף הפעולה! 🌸",
    "",
    "תזכורת תשלומים:",
    ...lines,
    `סה"כ לתשלום: ${formatShekels(total)}`,
  ];
}

/* הודעת תזכורת ידידותית עם הנוסח האישי ופירוט התשלומים. */
export function buildReminderMessage(studentFullName, unpaidPayments) {
  return reminderHead(studentFullName, unpaidPayments).join("\n");
}

/*
  הודעת בקשת תשלום *גורפת* (לכמה הורים) — נוסח אחיד וידידותי (לפי בקשת בעלת
  המוצר) עם שני קישורי התשלום של הוועד (מספר ביט + קישור פייבוקס) כפי שהוגדרו
  ב"הגדרות". ההודעה ניתנת לעריכה לפני השליחה.
*/
export function buildBulkPaymentRequestMessage(_ganName, links = {}) {
  const lines = [
    "היי 😊",
    "אנחנו עושים מעבר על יתרות כספי הוועד, ולפי הרישומים שלנו נותר תשלום.",
    "נשמח אם תוכלי להסדיר את התשלום בהקדם, כדי שנוכל להמשיך בניהול הפעילות השוטפת של הוועד.",
    "תודה רבה על שיתוף הפעולה! 🌸",
  ];
  if (links.bit || links.paybox) {
    lines.push("");
  }
  if (links.bit) {
    lines.push(`לתשלום בביט למספר: ${links.bit}`);
  }
  if (links.paybox) {
    lines.push(`וקישור לפייבוקס: ${links.paybox}`);
  }
  return lines.join("\n");
}

/*
  הודעת בקשת תשלום לפי אמצעי: לביט/פייבוקס מצורף קישור התשלום של הוועד;
  למזומן (או כשאין קישור) — תזכורת להסדרת התשלום בלבד. ההודעה נשלחת להורה בוואטסאפ.
*/
export function buildPaymentRequestMessage(studentFullName, unpaidPayments, method, links) {
  const head = reminderHead(studentFullName, unpaidPayments);
  if (method === "bit" && links?.bit) {
    return [...head, "", `לתשלום בביט למספר: ${links.bit}`].join("\n");
  }
  if (method === "paybox" && links?.paybox) {
    return [...head, "", `לתשלום בפייבוקס: ${links.paybox}`].join("\n");
  }
  // מזומן או ללא קישור — הנוסח כבר מבקש להסדיר, בלי שורת קישור נוספת
  return head.join("\n");
}
