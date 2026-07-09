/*
  paymentMethods — מקור אחד לאמצעי התשלום הנתמכים (ביט/פייבוקס/מזומן):
  גם רשימת הבחירה בטפסים וגם התוויות בתצוגה. הערכים (bit/paybox/cash)
  זהים למה שהשרת מצפה לו.
*/
export const PAYMENT_METHODS = [
  { value: "bit", label: "ביט" },
  { value: "paybox", label: "פייבוקס" },
  { value: "cash", label: "מזומן" },
];

const LABELS = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label]));

export function paymentMethodLabel(value) {
  return LABELS[value] || value;
}
