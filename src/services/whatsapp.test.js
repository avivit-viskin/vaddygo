import { extractShareMessage, whatsappShareUrl } from "./whatsapp";

/*
  extractShareMessage — מחלץ מתשובת העוזרת רק את ההודעה המוכנה לשליחה,
  בלי הפתיח ("היי, בשמחה...") והסיום ("אם תרצי שאדייק...") המשוחחים.
*/

test("תשובה קצרה של פסקה אחת — מוחזרת כמו שהיא", () => {
  const answer = "הודעה חמה להורים 💜";
  expect(extractShareMessage(answer)).toBe(answer);
});

test("מסיר פתיח וסיום משוחחים ומשאיר רק את ההזמנה (הדוגמה של מסיבת סוף שנה)", () => {
  const answer = [
    "היי, בשמחה! איזה כיף, מסיבת סוף שנה! 🎉 בואי ננסח הזמנה קצרה וחמודה. איך זה נשמע?",
    "*מסיבת סוף שנה מגיעה!*\nנשמח לחגוג איתכם את סיום השנה ב[מקום], ב[תאריך], בשעה [שעה].\nבואו נעשה שמח! מחכות לכם 🎈",
    "אם תרצי שאדייק יותר, ספרי לי אם יש עלות, האם זו מסיבה להורים ולילדים יחד, או אם צריך לאשר הגעה 😊",
  ].join("\n\n");

  const shared = extractShareMessage(answer);
  expect(shared).toContain("מסיבת סוף שנה מגיעה");
  expect(shared).toContain("בואו נעשה שמח");
  // הפתיח והסיום המשוחחים לא נכללים
  expect(shared).not.toContain("בואי ננסח");
  expect(shared).not.toContain("אם תרצי שאדייק");
});

test("שתי פסקאות: פתיח משוחח + הודעה — מוחזרת רק ההודעה", () => {
  const answer =
    "בשמחה! הנה נוסח לתזכורת עדינה 🙂\n\nהורים יקרים, נזכיר בעדינות שהתשלום לחודש זה טרם התקבל. תודה רבה 💜";
  expect(extractShareMessage(answer)).toBe(
    "הורים יקרים, נזכיר בעדינות שהתשלום לחודש זה טרם התקבל. תודה רבה 💜"
  );
});

test("טקסט ריק — מוחזר ריק", () => {
  expect(extractShareMessage("")).toBe("");
  expect(extractShareMessage(null)).toBe("");
});

test("whatsappShareUrl מקודד את הטקסט לקישור wa.me", () => {
  expect(whatsappShareUrl("שלום")).toBe(
    `https://wa.me/?text=${encodeURIComponent("שלום")}`
  );
});
