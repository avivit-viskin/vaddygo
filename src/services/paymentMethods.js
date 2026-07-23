/*
  paymentMethods — מקור אחד לאמצעי התשלום. PAYMENT_METHODS = האמצעים להזנה
  ידנית (ביט/פייבוקס/מזומן). התצוגה (תווית+אייקון) כוללת גם "אשראי" — שאינו
  אמצעי להזנה ידנית אלא נקלט מהסליקה. אותם אייקונים משמשים בכל מקום (קוביות
  מסך הבית, חלון בקשת התשלום) כדי שיהיו זהים. הערכים זהים למה שהשרת מצפה לו.
*/
export const PAYMENT_METHODS = [
  { value: "bit", label: "BIT", icon: "💠" },
  { value: "paybox", label: "פייבוקס", icon: "📲" },
  { value: "cash", label: "מזומן", icon: "💵" },
];

/*
  COLLECTION_METHODS — אמצעי הגבייה מההורים בהזנה הידנית (מסך תשלומי התלמיד).
  כולל גם "אשראי" — כדי שאפשר יהיה לרשום ידנית תשלום שנגבה בכרטיס. הסכומים
  זהים למה שהשרת מצפה לו (PaymentUpsertDto: bitAmount/payBoxAmount/cashAmount/
  cardAmount). ההוצאות/מתנות ממשיכות להשתמש ב-PAYMENT_METHODS (בלי אשראי).
*/
export const COLLECTION_METHODS = [
  { value: "bit", label: "BIT" },
  { value: "paybox", label: "פייבוקס" },
  { value: "cash", label: "מזומן" },
  { value: "card", label: "אשראי" },
];

// תצוגה לכל אמצעי — כולל אשראי (card), שמופיע בקוביות/בקשת התשלום אך לא בהזנה.
const DISPLAY = {
  bit: { label: "BIT", icon: "💠" },
  paybox: { label: "פייבוקס", icon: "📲" },
  cash: { label: "מזומן", icon: "💵" },
  card: { label: "אשראי", icon: "💳" },
};

export function paymentMethodLabel(value) {
  return DISPLAY[value]?.label || value;
}

/* אייקון אמצעי התשלום (אמוג'י זמני — יוחלף באייקונים שבעלת המוצר תשלח). */
export function paymentMethodIcon(value) {
  return DISPLAY[value]?.icon || "💰";
}
