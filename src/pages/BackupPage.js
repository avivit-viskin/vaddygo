import { useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { loadDashboard } from "../services/dashboardService";
import { currentHebrewYearName } from "../services/schoolYear";
import { formatShekels } from "../services/format";
import {
  getSnapshots,
  saveSnapshot,
  deleteSnapshot,
  buildBackup,
} from "../services/yearlyArchive";
import { toastSuccess } from "../services/toastBus";
import Button from "../components/Button";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import "../styles/report.css";

/*
  BackupPage (/backup) — פיצ'ר פרו: גיבוי והשוואה בין שנים.
  • "הורדת גיבוי מלא" — כל נתוני האפליקציה לקובץ JSON (לשמירה/העברה לוועד הבא).
  • "שמירת סיכום השנה" — שומר תמצית השנה הנוכחית; הטבלה משווה שנים זו לצד זו.
*/
function downloadBackup(now = new Date()) {
  const backup = buildBackup(now);
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vaddygo-backup-${now.toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function BackupPage() {
  const { data: dashboard } = useApi(loadDashboard);
  const [snapshots, setSnapshots] = useState(() => getSnapshots());

  function refresh() {
    setSnapshots(getSnapshots());
  }

  function handleSaveSnapshot() {
    if (!dashboard) return;
    saveSnapshot(dashboard);
    refresh();
    toastSuccess("סיכום השנה נשמר ✓");
  }

  return (
    <div className="report-page">
      <div className="page-header">
        <h2>גיבוי והשוואה בין שנים</h2>
        <Link to="/">
          <Button variant="secondary">
            <Icon name="home" size={16} /> חזרה
          </Button>
        </Link>
      </div>

      <div className="backup-actions">
        <Button onClick={() => downloadBackup()}>
          <Icon name="folder" size={16} /> הורדת גיבוי מלא (JSON)
        </Button>
        {dashboard && (
          <Button variant="secondary" onClick={handleSaveSnapshot}>
            <Icon name="check" size={16} /> שמירת סיכום {currentHebrewYearName()}
          </Button>
        )}
      </div>
      <p className="report__empty" style={{ marginTop: 4 }}>
        הגיבוי שומר את כל נתוני הגן בקובץ במכשיר שלך — בלי סיסמאות. שמרו אותו
        במקום בטוח או העבירו לוועד הבא.
      </p>

      <h3 className="report__h2" style={{ marginTop: 24 }}>
        השוואה בין שנים
      </h3>
      {snapshots.length === 0 ? (
        <EmptyState
          icon="📊"
          message="עדיין לא שמרנו סיכום שנה — לחצו 'שמירת סיכום' כדי להתחיל להשוות."
        />
      ) : (
        <div className="tablewrap-scroll">
          <table className="report__table">
            <thead>
              <tr>
                <th>שנה</th>
                <th className="report__num">נגבה</th>
                <th className="report__num">הוצאות</th>
                <th className="report__num">יתרה</th>
                <th className="report__num">ילדים</th>
                <th aria-label="מחיקה" />
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.year}>
                  <td>{s.yearName || s.year}</td>
                  <td className="report__num">{formatShekels(s.collected)}</td>
                  <td className="report__num">{formatShekels(s.spent)}</td>
                  <td className="report__num">{formatShekels(s.balance)}</td>
                  <td className="report__num">{s.children}</td>
                  <td>
                    <button
                      type="button"
                      className="report__del"
                      aria-label={`מחיקת סיכום ${s.yearName || s.year}`}
                      onClick={() => {
                        deleteSnapshot(s.year);
                        refresh();
                      }}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BackupPage;
