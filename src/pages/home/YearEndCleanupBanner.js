import { useEffect, useState } from "react";
import { getGroups } from "../../services/groupsService";
import { getActiveServerGroupId } from "../../services/institutionsService";

/*
  YearEndCleanupBanner — התראה במסך הבית כשמתקרב מועד הניקוי האוטומטי של נתוני
  השנה (לקראת שנת לימודים חדשה). מופיע רק בשבועיים שלפני התאריך, כדי שהוועד יספיק
  לשמור/לייצא מה שצריך. הקטגוריות, הצוות ופרטי הגן נשמרים.
*/
const WARNING_DAYS = 14;

function daysUntil(dateStr) {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function YearEndCleanupBanner() {
  const [cleanupAt, setCleanupAt] = useState(null);

  useEffect(() => {
    let alive = true;
    getGroups()
      .then((groups) => {
        if (!alive || !Array.isArray(groups)) {
          return;
        }
        const activeId = getActiveServerGroupId();
        const active = groups.find((g) => g.id === activeId) || groups[0];
        setCleanupAt(active?.nextCleanupAt || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!cleanupAt) {
    return null;
  }
  const days = daysUntil(cleanupAt);
  if (days < 0 || days > WARNING_DAYS) {
    return null; // מציגים רק בחלון של שבועיים לפני
  }

  const dateLabel = new Date(cleanupAt).toLocaleDateString("he-IL");
  const whenLabel =
    days === 0 ? "היום" : days === 1 ? "מחר" : `בעוד ${days} ימים`;

  return (
    <div
      role="alert"
      style={{
        padding: "12px 14px",
        margin: "0 0 14px",
        borderRadius: 12,
        background: "#fdf1e7",
        border: "1px solid #f0c9a3",
        color: "#c05a17",
        fontSize: "var(--font-size-sm)",
        fontWeight: 600,
        lineHeight: 1.6,
      }}
    >
      ⚠️ נתוני השנה (תלמידים, תשלומים, הוצאות ואירועים) יימחקו אוטומטית ב־
      <strong>{dateLabel}</strong> ({whenLabel}), לקראת השנה החדשה. כדאי לשמור או
      לייצא מה שצריך לפני כן. הקטגוריות, הצוות ופרטי הגן יישמרו.
    </div>
  );
}

export default YearEndCleanupBanner;
