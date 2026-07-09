import { useState } from "react";
import Button from "../../components/Button";
import {
  parseStudentRows,
  importStudents,
  IMPORT_TEMPLATE,
} from "../../services/studentsImport";

/*
  StudentsImport — ייבוא תלמידים מקובץ (UI_SPEC ס' 11): מורידים תבנית, ממלאים
  שם הילד / שם ההורה / טלפון, מעלים את הקובץ, והמערכת יוצרת את כולם.
  מה שלא יובא נכון — מתקנים בעריכת התלמיד. onDone נקרא בסיום כדי לרענן.
*/
function StudentsImport({ onDone, onCancel }) {
  const [rows, setRows] = useState(null); // null=טרם נבחר קובץ
  const [fileName, setFileName] = useState("");
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

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setRows(parseStudentRows(String(reader.result)));
    reader.readAsText(file, "UTF-8");
  }

  async function handleImport() {
    setIsImporting(true);
    try {
      const summary = await importStudents(rows);
      setResult(summary);
      if (summary.added > 0) {
        onDone();
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
        <li>שומרים את הקובץ ומעלים אותו כאן.</li>
        <li>מה שלא ייקלט נכון — עורכים ידנית אחר כך בכל תלמיד.</li>
      </ol>

      <Button variant="secondary" onClick={downloadTemplate}>
        ⬇️ הורדת תבנית למילוי
      </Button>

      <label className="students-import__file">
        <span>בחירת קובץ (CSV):</span>
        <input type="file" accept=".csv,.txt" onChange={handleFile} />
      </label>

      {rows !== null && (
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
