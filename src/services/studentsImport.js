import { createStudent } from "./studentsService";

/*
  studentsImport — ייבוא תלמידים מקובץ (UI_SPEC ס' 11): קובץ עם עמודות
  שם הילד · שם ההורה · טלפון. תומך בקובצי Excel (‏.xlsx) וגם ב-CSV/טקסט.
  יוצרים תלמיד לכל שורה, ומה שלא יובא כמו שצריך — ניתן לתקן בעריכת כל תלמיד בנפרד.
*/

/* תבנית להורדה: כותרת + שורת דוגמה. BOM בהתחלה כדי שאקסל יציג עברית נכון. */
export const IMPORT_TEMPLATE =
  "﻿שם הילד,שם ההורה,טלפון\nהילי לוי,דנה לוי,050-1234567\n";

/*
  הופך שלושה תאים (שם הילד, שם ההורה, טלפון) לרשומת תלמיד — או null אם אין שם.
  שם הילד מפוצל לשם פרטי (מילה ראשונה) ולשם משפחה (השאר). התאים עוברים ל-String
  כי מ-Excel תא עשוי להגיע כמספר (למשל טלפון) או כ-null (תא ריק).
*/
function toStudentRow(childName, parentName, phone) {
  const name = String(childName ?? "").trim();
  if (!name) return null;
  const parts = name.split(/\s+/);
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
    parentName: String(parentName ?? "").trim(),
    parentPhoneNumber: String(phone ?? "").trim(),
  };
}

/* שורת כותרת = השורה הראשונה שבה עמודת הטלפון בלי אף ספרה (למשל "טלפון"). */
function isHeaderRow(index, phone) {
  return index === 0 && !/\d/.test(String(phone ?? ""));
}

/* ── CSV / טקסט ─────────────────────────────────────────── */

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

/* מנתח טקסט CSV לרשומות תלמיד. שורת כותרת מדולגת אוטומטית. */
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
    if (isHeaderRow(index, cols[2])) return;
    const row = toStudentRow(cols[0], cols[1], cols[2]);
    if (row) rows.push(row);
  });
  return rows;
}

/* ── Excel (‏.xlsx) ─────────────────────────────────────── */

/* מנתח טבלה מ-Excel: מערך של שורות, כל שורה מערך של תאים. */
export function parseStudentGrid(grid) {
  const rows = [];
  (grid || []).forEach((cells, index) => {
    const c = cells || [];
    if (isHeaderRow(index, c[2])) return;
    const row = toStudentRow(c[0], c[1], c[2]);
    if (row) rows.push(row);
  });
  return rows;
}

/*
  קורא קובץ שהמשתמשת בחרה ומחזיר רשומות תלמיד. תומך ב-Excel (‏.xlsx/.xls) וב-CSV/טקסט.
  ספריית ה-Excel נטענת רק כשצריך (טעינה עצלה) כדי לא להכביד על שאר המערכת ולא לטעון
  אותה בטסטים. זורק שגיאה אם הקובץ לא ניתן לקריאה — הקורא מציג הודעה ידידותית.
*/
export async function parseStudentFile(file) {
  const name = (file?.name || "").toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const { default: readXlsxFile } = await import("read-excel-file/browser");
    const grid = await readXlsxFile(file);
    return parseStudentGrid(grid);
  }
  const text = await file.text();
  return parseStudentRows(text);
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
