import { useState } from "react";
import Button from "../../components/Button";
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
  const [isReading, setIsReading] = useState(false);
  const [readError, setReadError] = useState("");
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
    setResult(null);
    setRows(null);

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

    setReadError("");
    setIsReading(true);
    try {
      setRows(await parseStudentFile(file));
    } catch (err) {
      setReadError(
        "לא הצלחנו לקרוא את הקובץ 😕 כדאי לוודא שזה קובץ Excel (‏.xlsx) או CSV, עם העמודות: שם הילד, שם ההורה, טלפון."
      );
    } finally {
      setIsReading(false);
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
      <ol className="students-import__steps">
        <li>
          מורידים את התבנית וממלאים בה: <strong>שם הילד · שם ההורה · טלפון</strong>{" "}
          (שורה לכל ילד).
        </li>
        <li>שומרים את הקובץ (Excel או CSV) ומעלים אותו כאן.</li>
        <li>מה שלא ייקלט נכון — עורכים ידנית אחר כך בכל תלמיד.</li>
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

      {isReading && <p className="students-import__count">קוראים את הקובץ...</p>}

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
