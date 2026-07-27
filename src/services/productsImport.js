/*
  productsImport — ייבוא מרוכז של מוצרי ספק מקובץ Excel/CSV (כמו ייבוא התלמידים).
  העמודות מזוהות לפי *שם* (לא לפי מיקום), כך שהסדר יכול להשתנות:
    • שם / מוצר / פריט / name      → שם המוצר (חובה)
    • מחיר / price / עלות          → מחיר
    • תמונה / קישור / image / url  → קישור לתמונה (אופציונלי)
  מחזיר [{ name, price, imageUrl }]. תומך ב-CSV וב-Excel (SheetJS, טעינה עצלה).
*/

/* תבנית להורדה: כותרת + שתי שורות דוגמה. BOM כדי שאקסל יציג עברית נכון. */
export const PRODUCTS_IMPORT_TEMPLATE =
  "﻿שם המוצר,מחיר,קישור לתמונה\n" +
  "מגש פירות,350,https://\n" +
  "עוגת שוקולד אישית,12,\n";

function normalizeHeader(raw) {
  return String(raw ?? "")
    .replace(/["'`׳״]/g, "")
    .replace(/[.\-_/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* מסווג כותרת אחת לשדה מוכר (או null). הבדיקות הצרות (מחיר/תמונה) קודם ל"שם". */
function classifyHeader(raw) {
  const h = normalizeHeader(raw);
  if (!h) return null;
  if (/מחיר|price|עלות|סכום|₪/i.test(h)) return "price";
  if (/תמונ|image|photo|קישור|url|לינק|link/i.test(h)) return "imageUrl";
  if (/שם|מוצר|פריט|name|product|item/i.test(h)) return "name";
  return null;
}

function buildColumnMap(headerCells) {
  const map = {};
  (headerCells || []).forEach((cell, idx) => {
    const key = classifyHeader(cell);
    if (key && map[key] == null) map[key] = idx;
  });
  return map;
}

/* "‏1,200 ₪" → 1200. שומר על מספרים, מסיר מטבע/פסיקים/רווחים. */
function parsePrice(value) {
  if (typeof value === "number") return value;
  const digits = String(value ?? "").replace(/[^\d.]/g, "");
  return Number(digits) || 0;
}

function rowFromCells(cells, map) {
  const c = cells || [];
  const get = (key) => (map[key] == null ? "" : String(c[map[key]] ?? "").trim());
  const name = get("name");
  if (!name) return null;
  return {
    name,
    price: parsePrice(map.price == null ? "" : c[map.price]),
    imageUrl: get("imageUrl"),
  };
}

/* קובץ בלי כותרות — לפי מיקום: עמודה 1 = שם, 2 = מחיר, 3 = תמונה. */
function positionalRow(cells) {
  const c = cells || [];
  const name = String(c[0] ?? "").trim();
  if (!name) return null;
  return { name, price: parsePrice(c[1]), imageUrl: String(c[2] ?? "").trim() };
}

function parseGrid(grid) {
  const rows = (grid || []).filter((r) => Array.isArray(r));
  if (rows.length === 0) return [];

  // מאתר שורת כותרת: הראשונה מבין העשר הראשונות שיש בה עמודת "שם" מזוהה
  const limit = Math.min(rows.length, 10);
  for (let i = 0; i < limit; i += 1) {
    const map = buildColumnMap(rows[i]);
    if (map.name != null) {
      return rows
        .slice(i + 1)
        .map((cells) => rowFromCells(cells, map))
        .filter(Boolean);
    }
  }
  // אין כותרת מזוהה — קוראים לפי מיקום
  return rows.map(positionalRow).filter(Boolean);
}

/* ── CSV ─────────────────────────────────────────────────── */
function detectDelimiter(text) {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  for (const ch of text) if (ch in counts) counts[ch] += 1;
  return Object.keys(counts).reduce((a, b) => (counts[b] > counts[a] ? b : a), ",");
}

function splitLine(line, delimiter) {
  const cols = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === delimiter && !inQuotes) {
      cols.push(current);
      current = "";
    } else current += ch;
  }
  cols.push(current);
  return cols.map((c) => c.trim());
}

export function parseProductRows(text) {
  const clean = (text || "").replace(/^﻿/, "");
  const delimiter = detectDelimiter(clean);
  const grid = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((line) => splitLine(line, delimiter));
  return parseGrid(grid);
}

/*
  קורא את הקובץ שהספק בחר ומחזיר מוצרים. CSV נקרא כטקסט; Excel דרך SheetJS
  (אותה ספרייה של ייבוא התלמידים, נטענת רק כשצריך). לוקח את הגיליון עם הכי הרבה שורות.
*/
export async function parseProductFile(file) {
  const name = (file?.name || "").toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    return parseProductRows(await file.text());
  }
  const data = new Uint8Array(await file.arrayBuffer());
  const mod = await import("xlsx");
  const XLSX = mod.default || mod;
  const workbook = XLSX.read(data, { type: "array" });
  let grid = [];
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      blankrows: false,
      defval: "",
    });
    if (rows.length > grid.length) grid = rows;
  }
  return parseGrid(grid);
}
