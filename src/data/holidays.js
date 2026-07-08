/*
  holidays.js — חגי ישראל ללוח השנה.

  עיקרון: לא ממציאים תאריכים. כל חג מוגדר לפי התאריך העברי הקבוע שלו
  (עובדה הלכתית/חוקית), וההמרה לתאריך לועזי נעשית על ידי מנוע התאריכים
  המובנה בדפדפן (Intl, לוח שנה עברי) — כך התאריכים נכונים בכל שנה.
*/

// חגים של יום בודד: [חודש עברי (בשם שנותן Intl באנגלית), יום, שם להצגה]
const SINGLE_DAY_HOLIDAYS = [
  { month: "Tishri", day: 1, name: "ראש השנה" },
  { month: "Tishri", day: 2, name: "ראש השנה" },
  { month: "Tishri", day: 10, name: "יום כיפור" },
  { month: "Tishri", day: 22, name: "שמחת תורה" },
  { month: "Shevat", day: 15, name: 'ט"ו בשבט' },
  // פורים: י"ד באדר. בשנה מעוברת Intl מחזיר "Adar II" — שתי ההגדרות מכסות את שני המקרים.
  { month: "Adar", day: 14, name: "פורים" },
  { month: "Adar II", day: 14, name: "פורים" },
  { month: "Iyar", day: 18, name: 'ל"ג בעומר' },
  { month: "Sivan", day: 6, name: "שבועות" },
];

// חגים של כמה ימים רצופים, לפי יום ההתחלה העברי ואורך בימים
const SPAN_HOLIDAYS = [
  { month: "Tishri", day: 15, length: 7, name: "סוכות" },
  { month: "Kislev", day: 25, length: 8, name: "חנוכה" },
  { month: "Nisan", day: 15, length: 7, name: "פסח" },
];

const hebrewFormatter = new Intl.DateTimeFormat("en-u-ca-hebrew", {
  day: "numeric",
  month: "long",
});

// מחזיר את התאריך העברי (יום + שם חודש) של תאריך לועזי
function toHebrewDate(date) {
  const parts = hebrewFormatter.formatToParts(date);
  return {
    day: Number(parts.find((p) => p.type === "day").value),
    month: parts.find((p) => p.type === "month").value,
  };
}

// תאריך בצהריים — מונע הזזת יום בגלל אזורי זמן
function atNoon(year, monthIndex, day) {
  return new Date(year, monthIndex, day, 12);
}

function addDays(date, amount) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + amount,
    12
  );
}

/*
  יום העצמאות (ה' באייר) מוזז לפי חוק כדי לא להתנגש בשבת:
  חל בשישי → מוקדם לחמישי · חל בשבת → מוקדם לחמישי · חל בשני → נדחה לשלישי.
  יום הזיכרון הוא תמיד יום לפני יום העצמאות הנחגג.
*/
function observedIndependenceDay(nominalDate) {
  const weekday = nominalDate.getDay(); // 0=ראשון ... 6=שבת
  if (weekday === 5) return addDays(nominalDate, -1); // שישי → חמישי
  if (weekday === 6) return addDays(nominalDate, -2); // שבת → חמישי
  if (weekday === 1) return addDays(nominalDate, 1); // שני → שלישי
  return nominalDate;
}

/*
  מחזיר Map: יום-בחודש (מספר) → מערך שמות חגים, עבור חודש לועזי נתון.
  סורק גם ימים קצת לפני ואחרי החודש כדי לתפוס חגים מרובי-ימים שהתחילו
  בחודש הקודם ואת הזזות יום העצמאות.
*/
export function getHolidaysForMonth(year, monthIndex) {
  const holidaysByDay = new Map();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const addIfInMonth = (date, name) => {
    if (date.getFullYear() !== year || date.getMonth() !== monthIndex) return;
    const day = date.getDate();
    const names = holidaysByDay.get(day) || [];
    if (!names.includes(name)) names.push(name);
    holidaysByDay.set(day, names);
  };

  // טווח סריקה: 10 ימים לפני תחילת החודש (חנוכה באורך 8) עד 3 ימים אחריו
  for (let offset = -10; offset < daysInMonth + 3; offset++) {
    const date = atNoon(year, monthIndex, 1 + offset);
    const hebrew = toHebrewDate(date);

    for (const holiday of SINGLE_DAY_HOLIDAYS) {
      if (hebrew.month === holiday.month && hebrew.day === holiday.day) {
        addIfInMonth(date, holiday.name);
      }
    }

    for (const holiday of SPAN_HOLIDAYS) {
      if (hebrew.month === holiday.month && hebrew.day === holiday.day) {
        for (let i = 0; i < holiday.length; i++) {
          addIfInMonth(addDays(date, i), holiday.name);
        }
      }
    }

    if (hebrew.month === "Iyar" && hebrew.day === 5) {
      const independence = observedIndependenceDay(date);
      addIfInMonth(independence, "יום העצמאות");
      addIfInMonth(addDays(independence, -1), "יום הזיכרון");
    }
  }

  return holidaysByDay;
}
