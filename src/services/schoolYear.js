/*
  schoolYear — כלל שנת הלימודים, זהה לכלל שבשרת (SchoolYear.cs):
  מיולי ואילך נערכים לשנה שנפתחת בספטמבר הקרוב (השנה הלועזית הנוכחית);
  עד יוני — השנה שנפתחה בספטמבר הקודם.
*/
export function currentSchoolYear(today = new Date()) {
  const month = today.getMonth() + 1;
  return month >= 7 ? today.getFullYear() : today.getFullYear() - 1;
}

const ONES = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
const TENS = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
const HUNDREDS = ["", "ק", "ר", "ש", "ת"];

/*
  שם שנה עברית באותיות (גימטריה) לפי מספר השנה העברית: 5786 ← "תשפ"ו".
  הגרשיים נכנסים לפני האות האחרונה, ו-15/16 נכתבים ט"ו/ט"ז כמקובל.
*/
export function hebrewYearName(hebrewYear) {
  let n = hebrewYear - 5000; // בלי האלפים (ה')
  let letters = "";

  while (n >= 400) {
    letters += "ת";
    n -= 400;
  }
  letters += HUNDREDS[Math.floor(n / 100)];
  n %= 100;

  if (n === 15) {
    letters += "טו";
  } else if (n === 16) {
    letters += "טז";
  } else {
    letters += TENS[Math.floor(n / 10)] + ONES[n % 10];
  }

  if (letters.length < 2) {
    return letters;
  }
  return `${letters.slice(0, -1)}"${letters.slice(-1)}`;
}

/*
  שם שנת הלימודים העברית לפי השנה הלועזית שהיא נפתחת בה (ספטמבר):
  2026 ← "תשפ"ז" (שנת הלימודים שנפתחת בספטמבר 2026 היא ה'תשפ"ז = 5787).
*/
export function hebrewSchoolYearName(gregorianYear) {
  return hebrewYearName(gregorianYear + 3761);
}

/*
  השנה העברית הנוכחית באותיות — מחושבת מהתאריך דרך לוח השנה העברי, ולכן
  מסתנכרנת מעצמה: היום היא "תשפ"ו", ובראש השנה הבא תתחלף אוטומטית ל"תשפ"ז".
*/
const hebrewYearFormatter = new Intl.DateTimeFormat("en-u-ca-hebrew", {
  year: "numeric",
});
export function currentHebrewYearName(today = new Date()) {
  const hebrewYear = Number(
    hebrewYearFormatter.format(today).replace(/[^\d]/g, "")
  );
  return hebrewYearName(hebrewYear);
}
