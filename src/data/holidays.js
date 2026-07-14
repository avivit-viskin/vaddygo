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

// ערבי חג (ערב יום טוב) — תאריך עברי קבוע, היום שלפני תחילת החג.
// מוצגים בלוח בלבד (לא ברשימת החגים/התקציבים).
const EVE_HOLIDAYS = [
  { month: "Elul", day: 29, name: "ערב ראש השנה" },
  { month: "Tishri", day: 9, name: "ערב יום כיפור" },
  { month: "Tishri", day: 14, name: "ערב סוכות" },
  { month: "Nisan", day: 14, name: "ערב פסח" },
  { month: "Sivan", day: 5, name: "ערב שבועות" },
];

const hebrewFormatter = new Intl.DateTimeFormat("en-u-ca-hebrew", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// מחזיר את התאריך העברי (יום + שם חודש + שנה) של תאריך לועזי
function toHebrewDate(date) {
  const parts = hebrewFormatter.formatToParts(date);
  return {
    day: Number(parts.find((p) => p.type === "day").value),
    month: parts.find((p) => p.type === "month").value,
    year: Number(parts.find((p) => p.type === "year").value),
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
  מופעי החגים בחודש לועזי נתון.
  מחזיר מערך: { name, days (ימי החודש), hebrewYear } — ממוין לפי היום הראשון.
  hebrewYear משמש כמזהה של המופע (למשל לתקציב חג): חנוכה תשפ"ז הוא אותו
  מופע גם כשרואים אותו בדצמבר וגם בינואר.
*/
export function getHolidayOccurrencesForMonth(year, monthIndex) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const occurrences = new Map(); // "שם|שנה עברית" → מופע

  const addDay = (date, name, hebrewYear) => {
    if (date.getFullYear() !== year || date.getMonth() !== monthIndex) return;
    const key = `${name}|${hebrewYear}`;
    const occurrence =
      occurrences.get(key) || { name, hebrewYear, days: [] };
    if (!occurrence.days.includes(date.getDate())) {
      occurrence.days.push(date.getDate());
    }
    occurrences.set(key, occurrence);
  };

  // טווח סריקה: 10 ימים לפני תחילת החודש (חנוכה באורך 8) עד 3 ימים אחריו
  for (let offset = -10; offset < daysInMonth + 3; offset++) {
    const date = atNoon(year, monthIndex, 1 + offset);
    const hebrew = toHebrewDate(date);

    for (const holiday of SINGLE_DAY_HOLIDAYS) {
      if (hebrew.month === holiday.month && hebrew.day === holiday.day) {
        addDay(date, holiday.name, hebrew.year);
      }
    }

    for (const holiday of SPAN_HOLIDAYS) {
      if (hebrew.month === holiday.month && hebrew.day === holiday.day) {
        for (let i = 0; i < holiday.length; i++) {
          addDay(addDays(date, i), holiday.name, hebrew.year);
        }
      }
    }

    if (hebrew.month === "Iyar" && hebrew.day === 5) {
      const independence = observedIndependenceDay(date);
      addDay(independence, "יום העצמאות", hebrew.year);
      addDay(addDays(independence, -1), "יום הזיכרון", hebrew.year);
    }
  }

  return [...occurrences.values()]
    .map((occurrence) => ({
      ...occurrence,
      days: occurrence.days.sort((a, b) => a - b),
    }))
    .sort((a, b) => a.days[0] - b.days[0]);
}

/*
  מחזיר Map: יום-בחודש (מספר) → מערך שמות חגים — לסימון תגים ברשת הלוח.
  כולל גם "ערב חג" (היום שלפני החג) לפי התאריך העברי הקבוע — לתצוגה בלוח בלבד;
  ערבי החג *אינם* נכנסים ל-getHolidayOccurrencesForMonth (רשימת החגים/התקציבים).
*/
export function getHolidaysForMonth(year, monthIndex) {
  const holidaysByDay = new Map();
  const add = (day, name) => {
    const names = holidaysByDay.get(day) || [];
    if (!names.includes(name)) names.push(name);
    holidaysByDay.set(day, names);
  };

  for (const occurrence of getHolidayOccurrencesForMonth(year, monthIndex)) {
    for (const day of occurrence.days) add(day, occurrence.name);
  }

  // ערבי חג — לפי התאריך העברי הקבוע שלהם
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const hebrew = toHebrewDate(atNoon(year, monthIndex, day));
    for (const eve of EVE_HOLIDAYS) {
      if (hebrew.month === eve.month && hebrew.day === eve.day) add(day, eve.name);
    }
  }

  return holidaysByDay;
}

/*
  ראש חודש — כל יום שהוא א' לחודש העברי. מוחזר Set של ימי-החודש הלועזי,
  לסימון "חולצה לבנה + ר"ח" בלוח. ימים שהם גם חג (כמו א' בתשרי = ראש השנה,
  או ר"ח שנופל בחנוכה) לא נספרים — בחג/חופשה אין גן וטקס חולצה לבנה,
  וכדי לא להעמיס את התא.
*/
export function getRoshChodeshForMonth(year, monthIndex) {
  const holidayDays = new Set();
  for (const occurrence of getHolidayOccurrencesForMonth(year, monthIndex)) {
    for (const day of occurrence.days) holidayDays.add(day);
  }

  const roshChodeshDays = new Set();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const hebrew = toHebrewDate(atNoon(year, monthIndex, day));
    if (hebrew.day === 1 && !holidayDays.has(day)) roshChodeshDays.add(day);
  }
  return roshChodeshDays;
}
