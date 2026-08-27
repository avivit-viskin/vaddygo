#!/usr/bin/env node
/*
  check-imports — מוודא שכל ייבוא יחסי בקבצים שעומדים להידחף מצביע על קובץ
  ש**קיים ב-git**, ולא רק על הדיסק.

  ── למה זה קיים ──
  כמה סוכנים עובדים באותה תיקייה ועל אותם קבצים. ב-27.08.2026 סוכן אחד הוסיף
  ל-`CalendarPage.js` שורת ייבוא לרכיב חדש שטרם נשמר ב-git. סוכן אחר ערך את
  אותו קובץ מסיבה אחרת, דחף רק את הקבצים שלו — **וסחב איתו את שורת הייבוא בלי
  הקובץ שהיא מפנה אליו**. ‏main נשבר, ושום דבר לא נפרס עד שהחסר הושלם.

  הבדיקה הרגילה אינה תופסת את זה: על הדיסק המקומי הקובץ קיים, והכול עובד.
  הוא פשוט לא קיים אצל אף אחד אחר. לכן ההשוואה היא מול `git ls-files` ולא
  מול מערכת הקבצים.

  ── שימוש ──
    node scripts/check-imports.js          # הקבצים ב-staging (לפני commit)
    node scripts/check-imports.js --all    # כל src (בדיקה רחבה)

  יוצא בקוד 1 אם נמצא ייבוא שבור — כדי שאפשר יהיה לשרשר אותו לפני דחיפה.
*/
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SCAN_EXT = [".js", ".jsx"];
// סיומות שמנסים להשלים כשהייבוא נכתב בלי סיומת (כמו שה-bundler עושה)
const RESOLVE_AS = ["", ".js", ".jsx", ".json", ".css", "/index.js", "/index.jsx"];

function git(cmd) {
  return execSync(`git ${cmd}`, { encoding: "utf8" });
}

/* כל הקבצים המנוהלים ב-git — זו רשימת האמת שכל סוכן אחר יראה. */
function trackedFiles() {
  return new Set(
    git("ls-files")
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean)
  );
}

/* מה נבדק: מה שב-staging, או כל src עם --all. */
function filesToCheck(all) {
  const raw = all
    ? git("ls-files src")
    : git("diff --cached --name-only --diff-filter=ACM");
  return raw
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f && SCAN_EXT.includes(path.extname(f)) && fs.existsSync(f));
}

/* ייבוא יחסי בלבד — חבילות מ-node_modules אינן נבדקות כאן. */
const IMPORT_RE = /(?:import\s[^'"]*from\s*|import\s*|require\s*\(\s*)['"](\.[^'"]+)['"]/g;

function findBrokenImports(file, tracked) {
  const source = fs.readFileSync(file, "utf8");
  const dir = path.dirname(file);
  const broken = [];

  for (const match of source.matchAll(IMPORT_RE)) {
    const spec = match[1];
    const base = path.posix.normalize(
      path.posix.join(dir.split(path.sep).join("/"), spec)
    );
    const resolved = RESOLVE_AS.map((ext) => base + ext).find((p) =>
      tracked.has(p)
    );
    if (!resolved) {
      // קיים על הדיסק אך לא ב-git = בדיוק המלכודת שהבדיקה נועדה לה
      const onDisk = RESOLVE_AS.map((ext) => base + ext).some((p) =>
        fs.existsSync(p)
      );
      broken.push({ spec, base, onDisk });
    }
  }
  return broken;
}

const all = process.argv.includes("--all");
const tracked = trackedFiles();
const files = filesToCheck(all);

if (files.length === 0) {
  console.log("check-imports: אין קבצים לבדיקה.");
  process.exit(0);
}

let problems = 0;
for (const file of files) {
  for (const b of findBrokenImports(file, tracked)) {
    problems += 1;
    console.log(`\n❌ ${file}`);
    console.log(`   מייבא: ${b.spec}`);
    if (b.onDisk) {
      console.log(
        "   הקובץ קיים אצלך על הדיסק אבל **אינו ב-git** — קרוב לוודאי עבודה"
      );
      console.log(
        "   לא-שמורה של סוכן אחר. דחיפה כזאת תשבור את main אצל כולם."
      );
      console.log("   מה לעשות: לא לדחוף את הקובץ הזה עד שהסוכן השני ידחוף את שלו.");
    } else {
      console.log("   הקובץ אינו קיים כלל — ייבוא שגוי או קובץ שנמחק.");
    }
  }
}

if (problems > 0) {
  console.log(`\ncheck-imports: נמצאו ${problems} ייבואים שבורים. אין לדחוף.`);
  process.exit(1);
}
console.log(`check-imports: ${files.length} קבצים נבדקו — כל הייבואים תקינים.`);
