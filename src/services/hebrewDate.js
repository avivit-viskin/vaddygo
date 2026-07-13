/*
  hebrewDate — המרת יום עברי (1–30) לאותיות עבריות (גימטריה), כי Intl מחזיר
  ספרות רגילות ("28") שנראות כמו תאריך לועזי נוסף. אותיות עבריות (כ״ח) הופכות
  את התאריך העברי לברור ומזוהה בלוח השנה.
*/
const ONES = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
const TENS = ["", "י", "כ", "ל"];

export function hebrewDayGematria(day) {
  const n = Number(day);
  if (!n || n < 1 || n > 30) {
    return String(day ?? "");
  }
  // ט״ו / ט״ז — יוצאי דופן (כדי לא לכתוב צירוף משם ה')
  if (n === 15) return "ט״ו";
  if (n === 16) return "ט״ז";

  const letters = (TENS[Math.floor(n / 10)] || "") + (ONES[n % 10] || "");
  if (letters.length === 1) {
    return letters + "׳"; // גרש לאות בודדת
  }
  return letters.slice(0, -1) + "״" + letters.slice(-1); // גרשיים לפני האות האחרונה
}

const hebrewDayFormatter = new Intl.DateTimeFormat("he-u-ca-hebrew", { day: "numeric" });
const hebrewMonthFormatter = new Intl.DateTimeFormat("he-u-ca-hebrew", { month: "long" });

/* תאריך עברי מלא באותיות: "ט״ו בתשרי" (יום בגימטריה + שם החודש). */
export function hebrewDateLabel(date) {
  const day = hebrewDayGematria(hebrewDayFormatter.format(date));
  const month = hebrewMonthFormatter.format(date);
  return `${day} ב${month}`;
}
