/*
  paymentMethods — מקור אחד לאמצעי התשלום הנתמכים (ביט/פייבוקס/מזומן):
  גם רשימת הבחירה בטפסים וגם התוויות בתצוגה. הערכים (bit/paybox/cash)
  זהים למה שהשרת מצפה לו.
*/
export const PAYMENT_METHODS = [
  { value: "bit", label: "BIT", icon: "💠" },
  { value: "paybox", label: "פייבוקס", icon: "📲" },
  { value: "cash", label: "מזומן", icon: "💵" },
];

const LABELS = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label]));
const ICONS = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.icon]));

export function paymentMethodLabel(value) {
  return LABELS[value] || value;
}

/* אייקון אמצעי התשלום (אמוג'י זמני — יוחלף באייקונים שבעלת המוצר תשלח). */
export function paymentMethodIcon(value) {
  return ICONS[value] || "💰";
}
