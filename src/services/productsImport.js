/*
  productsImport — ייבוא מרוכז של מוצרי ספק מקובץ Excel / CSV / PDF.
  בקבצי טבלה (Excel/CSV) העמודות מזוהות לפי *שם* (לא לפי מיקום), כך שהסדר גמיש:
    • שם / מוצר / פריט / name         → שם המוצר (חובה)
    • מחיר / price / עלות             → מחיר
    • פירוט / תיאור / description     → פירוט (אופציונלי)
    • תמונה / קישור / image / url     → קישור לתמונה (אופציונלי)
  ב-PDF מחלצים טקסט ומזהים שם+מחיר (ופירוט אם יש) — חילוץ "כמיטב היכולת" שכדאי
  לעבור עליו ולתקן; תמונות לא נשלפות מ-PDF. מחזיר [{ name, description, price,
  imageUrl }]. Excel דרך SheetJS ו-PDF דרך pdfjs — שתיהן בטעינה עצלה.
*/

/* תבנית להורדה: כותרת + שתי שורות דוגמה. BOM כדי שאקסל יציג עברית נכון. */
export const PRODUCTS_IMPORT_TEMPLATE =
  "﻿שם המוצר,מחיר,פירוט,קישור לתמונה\n" +
  "מגש פירות,350,מגש גדול עם 12 סוגי פירות,https://\n" +
  "עוגת שוקולד אישית,12,,\n";

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
  if (/פירוט|תיאור|תאור|הערות|description|desc|details/i.test(h))
    return "description";
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
    description: get("description"),
    price: parsePrice(map.price == null ? "" : c[map.price]),
    imageUrl: get("imageUrl"),
  };
}

/* קובץ בלי כותרות — לפי מיקום: 1=שם, 2=מחיר, 3=תמונה, 4=פירוט. */
function positionalRow(cells) {
  const c = cells || [];
  const name = String(c[0] ?? "").trim();
  if (!name) return null;
  return {
    name,
    description: String(c[3] ?? "").trim(),
    price: parsePrice(c[1]),
    imageUrl: String(c[2] ?? "").trim(),
  };
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

/* ── PDF ─────────────────────────────────────────────────── */
// pdfjs נטענת עצלה; ה-worker מוגש מ-public (אותה גרסה שהותקנה, כדי שיתאימו).
let pdfjsPromise = null;
async function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf").then((ns) => {
      const lib = ns.getDocument ? ns : ns.default || ns;
      lib.GlobalWorkerOptions.workerSrc =
        (process.env.PUBLIC_URL || "") + "/pdf.worker.min.js";
      return lib;
    });
  }
  return pdfjsPromise;
}

// פריטי טקסט של עמוד → שורות: קיבוץ לפי y (גובה), ומיון פנימי לפי x (רוחב).
function itemsToLines(items) {
  const withPos = (items || [])
    .filter((it) => it && typeof it.str === "string" && it.str.trim())
    .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }));
  withPos.sort((a, b) => b.y - a.y);
  const groups = [];
  let current = [];
  let currentY = null;
  for (const it of withPos) {
    if (currentY !== null && Math.abs(it.y - currentY) > 3) {
      groups.push(current);
      current = [];
    }
    current.push(it);
    currentY = it.y;
  }
  if (current.length) groups.push(current);
  return groups
    .map((group) =>
      group
        .slice()
        .sort((a, b) => a.x - b.x)
        .map((it) => it.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
}

// מזהה מחיר בשורה ומחזיר { name, price } (או null אם אין מחיר סביר בשורה).
function extractPriceAndName(line) {
  const patterns = [
    /(\d[\d,]*(?:\.\d+)?)\s*(?:₪|ש["']?\s*ח|שקל)/i, // 350 ₪
    /(?:₪|ש["']?\s*ח|שקל)\s*(\d[\d,]*(?:\.\d+)?)/i, // ₪ 350
    /(\d[\d,]*(?:\.\d+)?)\s*$/, // מספר בסוף השורה
  ];
  for (const re of patterns) {
    const m = line.match(re);
    if (!m) continue;
    const price = Number(String(m[1]).replace(/,/g, "")) || 0;
    if (price <= 0) continue;
    const before = line.slice(0, m.index).trim();
    const after = line.slice(m.index + m[0].length).trim();
    const name = (before || after)
      .replace(/^[\s.\-–—:_]+/, "")
      .replace(/[\s.\-–—:_]+$/, "")
      .trim();
    return { name, price };
  }
  return null;
}

/* שורות → מוצרים. תומך ב"שם ומחיר באותה שורה", וב"שם (ופירוט) בשורות ומחיר
   בשורה נפרדת". חילוץ כמיטב היכולת — הספק עובר ומתקן לפני שמירה. */
function linesToProducts(lines) {
  const products = [];
  let pending = null; // { name, desc: [] } — שם (ואולי פירוט) שממתין למחיר
  for (const line of lines) {
    const priced = extractPriceAndName(line);
    if (priced) {
      let name = priced.name;
      let description = "";
      if (!name && pending) {
        name = pending.name;
        description = pending.desc.join(" · ");
      }
      if (name) {
        products.push({ name, description, price: priced.price, imageUrl: "" });
      }
      pending = null;
    } else if (!pending) {
      pending = { name: line, desc: [] };
    } else {
      pending.desc.push(line);
    }
  }
  return products;
}

async function parsePdfFile(file) {
  const pdfjsLib = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const lines = [];
  for (let p = 1; p <= pdf.numPages; p += 1) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    lines.push(...itemsToLines(content.items));
  }
  return linesToProducts(lines);
}

/*
  קורא את הקובץ שהספק בחר ומחזיר מוצרים. CSV נקרא כטקסט; Excel דרך SheetJS;
  PDF דרך pdfjs (חילוץ טקסט). הספריות הכבדות נטענות רק כשצריך.
*/
export async function parseProductFile(file) {
  const name = (file?.name || "").toLowerCase();
  if (name.endsWith(".pdf")) {
    return parsePdfFile(file);
  }
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
