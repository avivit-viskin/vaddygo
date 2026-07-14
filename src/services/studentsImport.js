import { createStudent } from "./studentsService";

/*
  studentsImport — ייבוא תלמידים מקובץ (UI_SPEC ס' 11). תומך בשני מבנים:

  1. קובץ פשוט: שם הילד · שם ההורה · טלפון (התבנית להורדה).
  2. קובץ משרד החינוך: קובץ רחב עם כותרות בעברית (שם פרטי, שם משפחה, תעודת זהות,
     מין, תאריך לידה, אלרגיה, כתובת, ופרטי שני הורים כולל מייל וסטטוס נישואין).

  הזיהוי הוא לפי *שמות העמודות* ולא לפי מיקום, כך שהסדר בקובץ יכול להיות שונה
  והניסוח מעט אחר. מה שלא זוהה — ניתן להשלים בעריכת כל תלמיד. תומך ב-Excel וב-CSV.
*/

/* תבנית פשוטה להורדה: כותרת + שורת דוגמה. BOM בהתחלה כדי שאקסל יציג עברית נכון. */
export const IMPORT_TEMPLATE =
  "﻿שם הילד,שם ההורה,טלפון\nהילי לוי,דנה לוי,050-1234567\n";

/* השדות הנוספים (מעבר לשם/הורה/טלפון) — ריקים כברירת מחדל בכל שורה. */
function emptyExtras() {
  return {
    birthDate: "",
    idNumber: "",
    gender: "",
    allergies: "",
    address: "",
    parentEmail: "",
    parentBName: "",
    parentBPhone: "",
    parentBEmail: "",
    parentsMarried: "",
  };
}

/* ── זיהוי כותרות (מיפוי שם עמודה → שדה) ─────────────────────── */

/* מנרמל כותרת להשוואה: מסיר גרשיים, הופך נקודות/מקפים לרווח ומצמצם רווחים. */
function normalizeHeader(raw) {
  return String(raw ?? "")
    .replace(/["'`׳״]/g, "")
    .replace(/[.\-_/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
  מסווג כותרת אחת לשדה מוכר (או null אם לא זוהתה). קודם מזהים אם מדובר בשדה של
  הורה (א'/ב') ואז את סוגו; אחרת שדה של הילד/ה. הסדר חשוב — הבדיקות הצרות קודם.
*/
function classifyHeader(raw) {
  const h = normalizeHeader(raw);
  if (!h) return null;

  const slot = /הורה\s*ב|הורה\s*2|הורה\s*שני/.test(h)
    ? "B"
    : /הורה\s*א|הורה\s*1|הורה\s*ראשון/.test(h)
    ? "A"
    : /הורה|אפוטרופוס/.test(h)
    ? "A"
    : null;

  if (slot) {
    if (/טלפון|נייד|פלאפון|סלולר|מובייל/.test(h)) return `parent${slot}Phone`;
    if (/דואל|מייל|אימייל|email|e mail/i.test(h)) return `parent${slot}Email`;
    if (/משפח/.test(h)) return `parent${slot}Last`;
    return `parent${slot}First`; // "שם פרטי הורה" / "שם הורה" / "הורה"
  }

  if (/אלרג/.test(h)) return "allergies";
  if (/תעודת זהות|מספר זהות|ת ז|תז|ז ת/.test(h)) return "idNumber";
  if (/מגדר|מין/.test(h)) return "gender";
  if (/לידה/.test(h)) return "birthDate";
  if (/רחוב|כתובת/.test(h)) return "street";
  if (/דירה/.test(h)) return "apartment";
  if (/מספר בית|מס בית|בית/.test(h)) return "houseNumber";
  if (/נשוא/.test(h)) return "married";
  if (/שם פרטי/.test(h)) return "firstName";
  if (/שם משפחה|משפחה/.test(h)) return "lastName";
  if (/שם ה?ילד|שם התלמיד|שם הילדה|שם מלא|^שם$/.test(h)) return "childFullName";
  if (/טלפון|נייד|פלאפון|סלולר/.test(h)) return "parentAPhone";
  return null;
}

/* בונה מיפוי שדה → אינדקס עמודה משורת הכותרת (המופע הראשון מנצח). */
export function buildColumnMap(headerCells) {
  const map = {};
  (headerCells || []).forEach((cell, idx) => {
    const key = classifyHeader(cell);
    if (key && map[key] == null) map[key] = idx;
  });
  return map;
}

/* האם השורה הראשונה היא כותרת מוכרת (לפחות שני שדות, ואחד מהם שם הילד/ה). */
function isHeaderMap(map) {
  const recognized = Object.keys(map).length;
  const hasName =
    map.firstName != null || map.childFullName != null || map.lastName != null;
  return recognized >= 2 && hasName;
}

/* ── פירוק תאריך לידה (Excel Date או טקסט) ל-YYYY-MM-DD ──────── */
const pad = (n) => String(n).padStart(2, "0");

function parseBirthDate(value) {
  if (value == null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
      value.getDate()
    )}`;
  }
  const s = String(value).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); // כבר ISO
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/); // dd/mm/yyyy וכו'
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${pad(mo)}-${pad(d)}`;
  }
  return "";
}

/* ── בניית רשומת תלמיד ─────────────────────────────────────── */

/* מקובץ עם כותרות מוכרות: שולף כל שדה לפי המיפוי. null אם אין שם פרטי/מלא. */
function rowFromCells(cells, map) {
  const c = cells || [];
  const get = (key) => (map[key] == null ? "" : String(c[map[key]] ?? "").trim());

  let firstName = get("firstName");
  let lastName = get("lastName");
  if (!firstName) {
    const full = get("childFullName");
    if (full) {
      const parts = full.split(/\s+/);
      firstName = parts[0] || "";
      if (!lastName) lastName = parts.slice(1).join(" ");
    }
  }
  if (!firstName) return null;

  const street = get("street");
  const house = get("houseNumber");
  const apt = get("apartment");
  const address = [
    [street, house].filter(Boolean).join(" "),
    apt && `דירה ${apt}`,
  ]
    .filter(Boolean)
    .join(", ");

  const rawBirth = map.birthDate == null ? "" : c[map.birthDate];

  return {
    firstName,
    lastName,
    parentName: [get("parentAFirst"), get("parentALast")].filter(Boolean).join(" "),
    parentPhoneNumber: get("parentAPhone"),
    birthDate: parseBirthDate(rawBirth),
    idNumber: get("idNumber"),
    gender: get("gender"),
    allergies: get("allergies"),
    address,
    parentEmail: get("parentAEmail"),
    parentBName: [get("parentBFirst"), get("parentBLast")].filter(Boolean).join(" "),
    parentBPhone: get("parentBPhone"),
    parentBEmail: get("parentBEmail"),
    parentsMarried: get("married"),
  };
}

/* מהקובץ הפשוט (לפי מיקום): שם הילד · שם ההורה · טלפון. null אם אין שם. */
function legacyRowFromCells(cells) {
  const c = cells || [];
  const name = String(c[0] ?? "").trim();
  if (!name) return null;
  const parts = name.split(/\s+/);
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
    parentName: String(c[1] ?? "").trim(),
    parentPhoneNumber: String(c[2] ?? "").trim(),
    ...emptyExtras(),
  };
}

/* שורת כותרת (בקובץ הפשוט) = השורה הראשונה שבה עמודת הטלפון בלי אף ספרה. */
function isHeaderRow(index, phone) {
  return index === 0 && !/\d/.test(String(phone ?? ""));
}

/* מנתח טבלה (מערך שורות של תאים) לרשומות תלמיד — בוחר מבנה לפי הכותרות. */
function parseGrid(grid) {
  const rows = grid || [];
  if (rows.length === 0) return [];

  const map = buildColumnMap(rows[0]);
  if (isHeaderMap(map)) {
    return rows
      .slice(1)
      .map((cells) => rowFromCells(cells, map))
      .filter(Boolean);
  }

  // קובץ פשוט לפי מיקום (עם/בלי שורת כותרת)
  const out = [];
  rows.forEach((cells, index) => {
    const c = cells || [];
    if (isHeaderRow(index, c[2])) return;
    const row = legacyRowFromCells(c);
    if (row) out.push(row);
  });
  return out;
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

/* מנתח טקסט CSV לרשומות תלמיד. מבנה הקובץ מזוהה לפי הכותרות. */
export function parseStudentRows(text) {
  const clean = (text || "").replace(/^﻿/, "");
  const delimiter = detectDelimiter(clean);
  const grid = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((line) => splitLine(line, delimiter));
  return parseGrid(grid);
}

/* ── Excel (‏.xlsx) ─────────────────────────────────────── */

/*
  read-excel-file (v9) מחזיר מערך גיליונות בצורה [{ sheet, data }], כאשר data
  הוא מערך השורות. לוקחים את הגיליון הראשון שיש בו נתונים (תמיכה גם בקובץ עם כמה
  לשוניות). תואם גם לגרסאות ישנות שהחזירו ישירות מערך שורות.
*/
export function sheetToGrid(result) {
  if (!Array.isArray(result) || result.length === 0) return [];
  const first = result[0];
  if (first && !Array.isArray(first) && Array.isArray(first.data)) {
    const sheet = result.find((s) => s && s.data && s.data.length > 0) || first;
    return sheet.data || [];
  }
  return result; // גרסה ישנה: כבר מערך שורות
}

/* מנתח טבלה מ-Excel: מערך של שורות, כל שורה מערך של תאים. */
export function parseStudentGrid(grid) {
  return parseGrid(grid);
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
    const sheets = await readXlsxFile(file);
    return parseStudentGrid(sheetToGrid(sheets));
  }
  const text = await file.text();
  return parseStudentRows(text);
}

/*
  יוצר תלמיד לכל שורה, עם כל השדות שזוהו בקובץ. מחזיר סיכום: כמה נוספו וכמה נכשלו
  (עם השמות), כדי שהמשתמשת תדע מה לתקן ידנית. createFn מוזרק כדי לאפשר בדיקה.
*/
export async function importStudents(rows, createFn = createStudent) {
  let added = 0;
  const failed = [];
  for (const row of rows) {
    try {
      await createFn({
        firstName: row.firstName,
        lastName: row.lastName || "",
        parentName: row.parentName || "",
        className: "",
        parentPhoneNumber: row.parentPhoneNumber || "",
        birthDate: row.birthDate || null,
        idNumber: row.idNumber || "",
        gender: row.gender || "",
        allergies: row.allergies || "",
        address: row.address || "",
        parentEmail: row.parentEmail || "",
        parentBName: row.parentBName || "",
        parentBPhone: row.parentBPhone || "",
        parentBEmail: row.parentBEmail || "",
        parentsMarried: row.parentsMarried || "",
      });
      added += 1;
    } catch (err) {
      const name = `${row.firstName} ${row.lastName || ""}`.trim();
      failed.push({ name: name || "(ללא שם)", error: err.message });
    }
  }
  return { added, failed };
}
