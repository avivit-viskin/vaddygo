import { createStudent } from "./studentsService";

/*
  studentsImport — ייבוא תלמידים מקובץ (UI_SPEC ס' 11): קובץ עם עמודות
  שם הילד · שם ההורה · טלפון. מנתחים את הקובץ, יוצרים תלמיד לכל שורה,
  ומה שלא יובא כמו שצריך — ניתן לתקן בעריכת כל תלמיד בנפרד.
*/

/* תבנית להורדה: כותרת + שורת דוגמה. BOM בהתחלה כדי שאקסל יציג עברית נכון. */
export const IMPORT_TEMPLATE =
  "﻿שם הילד,שם ההורה,טלפון\nהילי לוי,דנה לוי,050-1234567\n";

/* מזהה את התו המפריד בין עמודות (פסיק/נקודה-פסיק/טאב) — אקסל בעברית נוטה ל-; */
function detectDelimiter(text) {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  for (const ch of text) {
    if (ch in counts) counts[ch] += 1;
  }
  return Object.keys(counts).reduce((a, b) => (counts[b] > counts[a] ? b : a), ",");
}

function splitLine(line, delimiter) {
  const cols = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      cols.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cols.push(current);
  return cols.map((c) => c.trim());
}

/*
  מנתח טקסט CSV לרשומות תלמיד. שם הילד מפוצל לשם פרטי (מילה ראשונה) ושם
  משפחה (השאר). שורת כותרת (שבה עמודת הטלפון בלי ספרה) מדולגת אוטומטית.
*/
export function parseStudentRows(text) {
  const clean = (text || "").replace(/^﻿/, "");
  const delimiter = detectDelimiter(clean);
  const lines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows = [];
  lines.forEach((line, index) => {
    const cols = splitLine(line, delimiter);
    const childName = (cols[0] || "").trim();
    const parentName = (cols[1] || "").trim();
    const phone = (cols[2] || "").trim();

    // דילוג על שורת כותרת: בשורה הראשונה, אם עמודת הטלפון בלי ספרות
    if (index === 0 && !/\d/.test(phone)) {
      return;
    }
    if (!childName) {
      return;
    }

    const parts = childName.split(/\s+/);
    rows.push({
      firstName: parts[0],
      lastName: parts.slice(1).join(" "),
      parentName,
      parentPhoneNumber: phone,
    });
  });

  return rows;
}

/*
  יוצר תלמיד לכל שורה. מחזיר סיכום: כמה נוספו וכמה נכשלו (עם השמות),
  כדי שהמשתמשת תדע מה לתקן ידנית. createFn מוזרק כדי לאפשר בדיקה.
*/
export async function importStudents(rows, createFn = createStudent) {
  let added = 0;
  const failed = [];
  for (const row of rows) {
    try {
      await createFn({
        firstName: row.firstName,
        lastName: row.lastName,
        parentName: row.parentName,
        className: "",
        parentPhoneNumber: row.parentPhoneNumber,
        birthDate: null,
      });
      added += 1;
    } catch (err) {
      const name = `${row.firstName} ${row.lastName}`.trim();
      failed.push({ name: name || "(ללא שם)", error: err.message });
    }
  }
  return { added, failed };
}
