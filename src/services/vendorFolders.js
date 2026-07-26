/*
  vendorFolders — תיקיות הספקים: חגים/אירועים שאליהם משייכים מוצרים.
  הרשימה היא הצעות (אפשר גם להקליד תיקייה משלך לכל ספק), והתצוגה מציגה רק
  תיקיות שיש בהן מוצרים.
*/
export const FOLDER_PRESETS = [
  "ראש השנה",
  "סוכות",
  "פסח",
  "שבת",
  "שבועות",
  "סוף שנה",
  "מתנות לצוות",
];

const GENERAL = "כללי";

/*
  groupByFolder — מקבץ את מוצרי הספק לפי תיקייה. סדר: קודם התיקיות המוגדרות
  (לפי FOLDER_PRESETS), אז תיקיות מותאמות-אישית, ולבסוף מוצרים בלי תיקייה
  ("כללי"). מחזיר [{ name, products }] — רק תיקיות שיש בהן מוצרים.
*/
export function groupByFolder(products = []) {
  const map = new Map();
  for (const p of products) {
    const key = (p.folder || "").trim() || GENERAL;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(p);
  }
  const rank = (name) => {
    const i = FOLDER_PRESETS.indexOf(name);
    if (i !== -1) return i; // תיקיות מוגדרות — לפי הסדר
    if (name === GENERAL) return 999; // "כללי" אחרון
    return 100; // מותאם-אישית — אחרי המוגדרות
  };
  return [...map.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .map(([name, prods]) => ({ name, products: prods }));
}
