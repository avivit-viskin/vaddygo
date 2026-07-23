/*
  paymentMethods — מקור אחד לכל אמצעי התשלום: ביט / פייבוקס / מזומן / אשראי.
  אותה רשימה משמשת בכל מקום — קוביות מסך הבית, הזנת תשלומי תלמיד, הוצאות,
  מתנות ובקשת התשלום — כדי שהאמצעים והאייקונים יהיו זהים ומסונכרנים. הערכים
  (value) זהים למה שהשרת מצפה לו: bit / paybox / cash / card.
*/
export const PAYMENT_METHODS = [
  { value: "bit", label: "BIT", icon: "💠" },
  { value: "paybox", label: "פייבוקס", icon: "📲" },
  { value: "cash", label: "מזומן", icon: "💵" },
  { value: "card", label: "אשראי", icon: "💳" },
];

// שם היסטורי לרשימת אמצעי הגבייה בהזנה הידנית — זהה כעת ל-PAYMENT_METHODS.
export const COLLECTION_METHODS = PAYMENT_METHODS;

// מפת תצוגה (תווית+אייקון) לפי ערך — נגזרת מהרשימה כדי שלא תהיה כפילות.
const DISPLAY = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m]));

export function paymentMethodLabel(value) {
  return DISPLAY[value]?.label || value;
}

/* אייקון אמצעי התשלום (אמוג'י זמני — יוחלף באייקונים שבעלת המוצר תשלח). */
export function paymentMethodIcon(value) {
  return DISPLAY[value]?.icon || "💰";
}
