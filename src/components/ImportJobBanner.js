import { useEffect, useState } from "react";
import {
  getImportJob,
  subscribeImportJob,
  clearImportJob,
} from "../services/importJobs";

/*
  ImportJobBanner — באנר גלובלי ל"משימת ייבוא" (חילוץ מוצרים מ-PDF/צילום) שרצה
  ברקע. מוצג קבוע בראש כל מסך באתר, כך שההודעה "המערכת עובדת על הקובץ" ממשיכה
  להופיע גם כשעוברים בין הדפים — ולא נעלמת עד שהמשימה מסתיימת. בפורטל הספק יש
  באנר משלו (עם קיצור "למוצרים»"), ולכן שם ה-App לא מציג את הבאנר הזה (כדי לא
  להכפיל). בזמן טעינה אין כפתור סגירה — כדי שלא יורידו בטעות משימה שעדיין רצה.
*/
function ImportJobBanner() {
  const [job, setJob] = useState(() => getImportJob());
  useEffect(() => subscribeImportJob(setJob), []);

  if (!job) {
    return null;
  }

  const tone =
    job.status === "done"
      ? { bg: "#eafaf1", border: "#b7e6cd", color: "#1d8a55" }
      : job.status === "loading"
      ? {
          bg: "var(--color-primary-light)",
          border: "var(--color-primary)",
          color: "var(--color-primary-dark)",
        }
      : { bg: "#fdf1e7", border: "#f0c9a3", color: "#c05a17" };

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 0,
        insetInline: 0,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        fontSize: "var(--font-size-sm)",
        fontWeight: 600,
        background: tone.bg,
        borderBottom: `1px solid ${tone.border}`,
        color: tone.color,
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
      }}
    >
      <span style={{ flex: 1 }}>{job.message}</span>
      {job.status !== "loading" && (
        <button
          type="button"
          aria-label="סגירה"
          onClick={clearImportJob}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            color: "inherit",
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default ImportJobBanner;
