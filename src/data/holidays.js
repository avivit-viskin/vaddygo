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
  { month: "Tishri", day: 3, name: "צום גדליה" },
  { month: "Tishri", day: 10, name: "יום כיפור" },
  { month: "Tishri", day: 22, name: "שמחת תורה" },
  { month: "Tevet", day: 10, name: "עשרה בטבת" },
  { month: "Shevat", day: 15, name: 'ט"ו בשבט' },
  // תענית אסתר, פורים ושושן פורים: אדר. בשנה מעוברת Intl מחזיר "Adar II" —
  // שתי ההגדרות (Adar + Adar II) מכסות שנה רגילה ומעוברת.
  { month: "Adar", day: 13, name: "תענית אסתר" },
  { month: "Adar II", day: 13, name: "תענית אסתר" },
  { month: "Adar", day: 14, name: "פורים" },
  { month: "Adar II", day: 14, name: "פורים" },
  { month: "Adar", day: 15, name: "שושן פורים" },
  { month: "Adar II", day: 15, name: "שושן פורים" },
  { month: "Nisan", day: 27, name: "יום השואה" },
  { month: "Iyar", day: 14, name: "פסח שני" },
  { month: "Iyar", day: 18, name: 'ל"ג בעומר' },
  { month: "Iyar", day: 28, name: "יום ירושלים" },
  { month: "Sivan", day: 6, name: "שבועות" },
  { month: "Tammuz", day: 17, name: 'י"ז בתמוז' },
  { month: "Av", day: 9, name: "תשעה באב" },
  { month: "Av", day: 15, name: 'ט"ו באב' },
];

// אמוג'י לכל חג/מועד (לפי בקשת בעלת המוצר) — להצגה בלוח וברשימת החגים.
const HOLIDAY_EMOJI = {
  "ראש חודש": "👕",
  "ראש השנה": "🍎",
  "צום גדליה": "🙏",
  "יום כיפור": "🤍",
  "סוכות": "🛖",
  "שמחת תורה": "🎉",
  "חנוכה": "🕎",
  "עשרה בטבת": "🙏",
  'ט"ו בשבט': "🌳",
  "תענית אסתר": "📜",
  "פורים": "🎭",
  "שושן פורים": "👑",
  "פסח": "🫓",
  "יום השואה": "🕯️",
  "יום הזיכרון": "🇮🇱",
  "יום העצמאות": "🎆",
  "פסח שני": "🫓",
  'ל"ג בעומר': "🔥",
  "יום ירושלים": "🏰",
  "שבועות": "🌾",
  'י"ז בתמוז': "🕯️",
  "תשעה באב": "🖤",
  'ט"ו באב': "❤️",
  // ערבי חג — האמוג'י של החג עצמו
  "ערב ראש השנה": "🍎",
  "ערב יום כיפור": "🤍",
  "ערב סוכות": "🛖",
  "ערב פסח": "🫓",
  "ערב שבועות": "🌾",
};

/* האמוג'י של חג לפי שמו (ריק אם אין) — לתצוגה בלוח וברשימת החגים. */
export function holidayEmoji(name) {
  return HOLIDAY_EMOJI[name] || "";
}

// חגים של כמה ימים רצופים, לפי יום ההתחלה העברי ואורך בימים
const SPAN_HOLIDAYS = [
  { month: "Tishri", day: 15, length: 7, name: "סוכות" },
  { month: "Kislev", day: 25, length: 8, name: "חנוכה" },
  { month: "Nisan", day: 15, length: 7, name: "פסח" },
];

// ערבי חג (ערב יום טוב) — תאריך עברי קבוע, היום שלפני תחילת החג.
// הערב מתמזג לתוך מופע החג כיום הראשון שלו: כך התאריך בלוח וברשימת החגים
// מתחיל מהערב חג. holiday = שם החג שאליו שייך הערב (לצורך המיזוג).
const EVE_HOLIDAYS = [
  { month: "Elul", day: 29, holiday: "ראש השנה" },
  { month: "Tishri", day: 9, holiday: "יום כיפור" },
  { month: "Tishri", day: 14, holiday: "סוכות" },
  { month: "Nisan", day: 14, holiday: "פסח" },
  { month: "Sivan", day: 5, holiday: "שבועות" },
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

  const addDay = (date, name, hebrewYear, isEve = false) => {
    if (date.getFullYear() !== year || date.getMonth() !== monthIndex) return;
    const key = `${name}|${hebrewYear}`;
    const occurrence =
      occurrences.get(key) || { name, hebrewYear, days: [], eveDays: [] };
    const dayNum = date.getDate();
    if (!occurrence.days.includes(dayNum)) occurrence.days.push(dayNum);
    if (isEve && !occurrence.eveDays.includes(dayNum)) {
      occurrence.eveDays.push(dayNum);
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

    // ערב חג — מתמזג לתוך מופע החג כיום הראשון שלו. שנת המופע נלקחת מיום
    // החג עצמו (יום אחרי הערב), כדי שערב ראש השנה (כ"ט אלול, בשנה הקודמת)
    // יתמזג עם ראש השנה של השנה הבאה.
    for (const eve of EVE_HOLIDAYS) {
      if (hebrew.month === eve.month && hebrew.day === eve.day) {
        const holidayYear = toHebrewDate(addDays(date, 1)).year;
        addDay(date, eve.holiday, holidayYear, true);
      }
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
  יום שהוא "ערב חג" (היום הראשון של מופע החג) מסומן "ערב <שם החג>".
*/
export function getHolidaysForMonth(year, monthIndex) {
  const holidaysByDay = new Map();
  const add = (day, name) => {
    const names = holidaysByDay.get(day) || [];
    if (!names.includes(name)) names.push(name);
    holidaysByDay.set(day, names);
  };

  for (const occurrence of getHolidayOccurrencesForMonth(year, monthIndex)) {
    const eveDays = occurrence.eveDays || [];
    for (const day of occurrence.days) {
      add(day, eveDays.includes(day) ? `ערב ${occurrence.name}` : occurrence.name);
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
