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
  // סכום חסר/לא-מספרי נספר כ-0 (עמידות מפני שדה שלא הוחזר).
  const paidSoFar = (p) =>
    (Number(p.bitAmount) || 0) +
    (Number(p.payBoxAmount) || 0) +
    (Number(p.cashAmount) || 0);
  // קטגוריה עם יעד סכום (amount>0) "שולמה" רק כשסכום האמצעים מכסה את היעד.
  // לקטגוריה בלי יעד סכום (0) אי אפשר לחשב "כמה נשאר", ולכן נשענים על דגל
  // התשלום (isPaid) — אחרת כל התלמידים היו נספרים כ"שילמו" והתזכורת "תיתקע"
  // על "כל ההורים שילמו" גם כשיש חייבים.
  const target = (p) => Number(p.amount) || 0;
  const isFullyPaid = (p) =>
    target(p) > 0 ? paidSoFar(p) >= target(p) : Boolean(p.isPaid);
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

/*
  הראש המשותף של הודעת תשלום: נוסח אישי ידידותי עם שם הילד, ואז "תזכורת
  תשלומים" עם פירוט הקטגוריות שטרם שולמו והסכום הכולל.
*/
function reminderHead(studentFullName, unpaidPayments) {
  const lines = unpaidPayments.map(
    (p) => `• ${p.categoryName}: ${formatShekels(p.amount)}`
  );
  const total = unpaidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
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
  הודעת בקשת תשלום *גורפת* (לכמה הורים) — הודעה אוטומטית לעריכה, עם שם הוועד,
  מקום למילוי הסכום, ושני קישורי התשלום של הוועד (ביט + פייבוקס) אם הוגדרו.
  המשתמשת עורכת ומכניסה את הסכום/פרטים לפני השליחה.
*/
export function buildBulkPaymentRequestMessage(ganName, links = {}) {
  const lines = ["שלום 🙂"];
  lines.push(
    ganName
      ? `דרישת תשלום של ____ ש"ח לטובת ועד ${ganName}.`
      : `דרישת תשלום של ____ ש"ח מהוועד.`
  );
  if (links.bit) {
    lines.push(`לתשלום בביט למספר: ${links.bit}`);
  }
  if (links.paybox) {
    lines.push(`לתשלום בפייבוקס: ${links.paybox}`);
  }
  lines.push("תודה רבה! 💜");
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
