import { useState } from "react";
import Button from "../../components/Button";
import Input from "../../components/Input";
import {
  parseStudentFile,
  importStudents,
  IMPORT_TEMPLATE,
} from "../../services/studentsImport";

/* רק CSV או Excel מותרים לייבוא — כל פורמט אחר נדחה עם הודעה ברורה */
const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

/*
  StudentsImport — ייבוא תלמידים מקובץ (UI_SPEC ס' 11): מורידים תבנית, ממלאים
  שם הילד / שם ההורה / טלפון, מעלים קובץ Excel (‏.xlsx) או CSV, והמערכת יוצרת
  את כולם. מה שלא יובא נכון — מתקנים בעריכת התלמיד. onDone מרענן את הרשימה,
  onCancel סוגר את החלון (וגם נקרא אוטומטית כשהייבוא הצליח במלואו).
*/
function StudentsImport({ onDone, onCancel }) {
  const [rows, setRows] = useState(null); // null=טרם נבחר קובץ
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); // הקובץ שנבחר (לפענוח עם סיסמה)
  const [isReading, setIsReading] = useState(false);
  const [readError, setReadError] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false); // הקובץ נעול — מבקשים סיסמה
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // הצגה/הסתרה של הסיסמה
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState(null);

  function downloadTemplate() {
    const blob = new Blob([IMPORT_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "תבנית-תלמידים.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSelectedFile(file);
    setResult(null);
    setRows(null);
    setNeedsPassword(false);
    setPassword("");
    setReadError("");

    // בדיקת פורמט לפני הכל: רק CSV/Excel — אחרת לא קוראים את הקובץ בכלל
    const isAllowed = ALLOWED_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    if (!isAllowed) {
      setReadError(
        "הפורמט לא תקין 🚫 אפשר להעלות רק קובץ CSV או Excel (‏.xlsx)."
      );
      event.target.value = ""; // איפוס כדי שאפשר יהיה לבחור שוב קובץ
      return;
    }

    await readFile(file);
  }

  /* קורא (ומפענח בשרת, אם צריך) את הקובץ. pwd מגיע כשהמשתמשת הקלידה סיסמה. */
  async function readFile(file, pwd) {
    setReadError("");
    setIsReading(true);
    try {
      const parsed = await parseStudentFile(file, pwd);
      setRows(parsed);
      setNeedsPassword(false);
    } catch (err) {
      if (err?.code === "ENCRYPTED") {
        setNeedsPassword(true); // הקובץ נעול — נבקש סיסמה
      } else if (err?.code === "WRONG_PASSWORD") {
        setNeedsPassword(true);
        setReadError("הסיסמה שגויה — נסי שוב 🔑");
      } else if (err?.code === "DECRYPT_FAILED") {
        setReadError(
          "לא הצלחנו לפענח את הקובץ 😕 ודאי שהסיסמה נכונה. אם זה לא עוזר — אפשר " +
            "להסיר את הסיסמה באקסל ולהעלות מחדש, או קובץ פשוט עם: שם תלמיד, טלפון, תאריך לידה."
        );
      } else {
        setReadError(
          "לא הצלחנו לקרוא את הקובץ 😕 אפשר גם קובץ פשוט עם: שם תלמיד, טלפון, תאריך לידה."
        );
      }
    } finally {
      setIsReading(false);
    }
  }

  function submitPassword(event) {
    event.preventDefault();
    if (selectedFile && password) {
      readFile(selectedFile, password);
    }
  }

  async function handleImport() {
    setIsImporting(true);
    try {
      const summary = await importStudents(rows);
      setResult(summary);
      if (summary.added > 0) {
        onDone(); // רענון הרשימה
        if (summary.failed.length === 0) {
          onCancel(); // הצלחה מלאה → סגירת החלון אוטומטית
        }
      }
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="students-import">
      <p className="students-import__intro">
        אפשר להעלות ישירות את <strong>קובץ משרד החינוך</strong> — המערכת מזהה לבד את
        העמודות (שם, ת"ז, תאריך לידה, אלרגיות, כתובת ופרטי שני ההורים) לפי שמן.{" "}
        <strong>ולא חייבים את כל השדות</strong> — אפשר גם קובץ פשוט עם מה שיש לך.
      </p>
      <ol className="students-import__steps">
        <li>
          מספיק קובץ פשוט עם:{" "}
          <strong>שם תלמיד · טלפון · תאריך לידה</strong> (שם ההורה ושאר הפרטים —
          לא חובה). אפשר להוריד תבנית מוכנה למילוי:
        </li>
        <li>שומרים את הקובץ (Excel או CSV) ומעלים אותו כאן.</li>
        <li>מה שלא ייקלט — משלימים ידנית אחר כך בעריכת התלמיד.</li>
      </ol>

      <Button variant="secondary" onClick={downloadTemplate}>
        ⬇️ הורדת תבנית למילוי
      </Button>

      <label className="students-import__file">
        <span>בחירת קובץ (Excel או CSV):</span>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFile}
        />
      </label>

      {needsPassword && (
        <form onSubmit={submitPassword} className="students-import__password">
          <p className="students-import__count">
            🔒 הקובץ נעול בסיסמה. הקלידי את הסיסמה שקיבלת כדי לפתוח אותו:
          </p>
          <div className="students-import__pw-wrap">
            <Input
              id="import-password"
              label="סיסמת הקובץ"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="students-import__eye"
              aria-label={showPassword ? "הסתרת הסיסמה" : "הצגת הסיסמה"}
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
          <Button type="submit" isLoading={isReading} disabled={!password}>
            פתיחת הקובץ 🔓
          </Button>
        </form>
      )}

      {isReading && (
        <p className="students-import__count">
          {needsPassword ? "מפענחים את הקובץ..." : "קוראים את הקובץ..."}
        </p>
      )}

      {readError && (
        <p className="students-import__error" role="alert">
          {readError}
        </p>
      )}

      {!isReading && !readError && rows !== null && (
        <p className="students-import__count">
          נמצאו <strong>{rows.length}</strong> תלמידים בקובץ {fileName && `(${fileName})`}.
        </p>
      )}

      {result && (
        <div className="students-import__result" role="status">
          <p>✅ נוספו {result.added} תלמידים.</p>
          {result.skipped > 0 && (
            <p>⏭️ {result.skipped} כבר היו ברשימה ולא נוספו שוב (כפילויות).</p>
          )}
          {result.failed.length > 0 && (
            <>
              <p>⚠️ {result.failed.length} לא נוספו:</p>
              <ul>
                {result.failed.slice(0, 10).map((f, i) => (
                  <li key={i}>
                    {f.name} — {f.error}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="students-import__actions">
        {!result && (
          <Button
            onClick={handleImport}
            isLoading={isImporting}
            disabled={!rows || rows.length === 0}
          >
            ייבוא {rows?.length ? `${rows.length} תלמידים` : ""}
          </Button>
        )}
        <Button variant="secondary" onClick={onCancel}>
          {result ? "סגירה" : "ביטול"}
        </Button>
      </div>
    </div>
  );
}

export default StudentsImport;
