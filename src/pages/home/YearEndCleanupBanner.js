import { useState } from "react";
import { getActiveInstitution } from "../../services/institutionsService";

/*
  YearEndCleanupBanner — התראה במסך הבית כשמתקרב מועד הניקוי האוטומטי של נתוני
  השנה (לקראת שנת לימודים חדשה). מופיע רק בשבועיים שלפני התאריך, כדי שהוועד יספיק
  לשמור/לייצא מה שצריך. הקטגוריות, הצוות ופרטי הגן נשמרים.

  אפשר לסגור את ההתראה ב-✕. הסגירה נזכרת לפי גן+תאריך (localStorage), כך שהיא
  לא חוזרת בכל רענון — אבל תופיע שוב במועד מחיקה חדש בשנה הבאה. בכל מקרה נשלחת גם
  תזכורת במייל, כך שסגירה כאן אינה מפספסת את ההתראה.
*/
const WARNING_DAYS = 14;
const DISMISS_PREFIX = "vaadygo.cleanupDismissed.";

function daysUntil(dateStr) {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

// מפתח סגירה ייחודי לגן ולתאריך — כדי שסגירה של השנה הזו לא תשתיק את הבאה
function dismissKey(groupId, cleanupAt) {
  return `${DISMISS_PREFIX}${groupId ?? "x"}.${cleanupAt}`;
}

function YearEndCleanupBanner() {
  /*
    נקרא **פעם אחת בהרכבה** מהנתונים שכבר קיימים במכשיר, ולא בשליפה מהשרת.

    🔴 באג שדווח מהשטח: "תזוזה של הקטגוריות, מסך רועד". הבאנר שלף את הגנים
    מהשרת ב-useEffect, ואז נכנס **מעל** התוכן ודחף את הקטגוריות למטה — בכל
    טעינה של מסך הבית. במקביל זו הייתה קריאת רשת מיותרת: אותם נתונים כבר
    נמשכים בעליית האפליקציה ונשמרים ברשימת המוסדות.
  */
  const [institution] = useState(() => getActiveInstitution());
  const cleanupAt = institution?.nextCleanupAt || null;
  const groupId = institution?.serverGroupId ?? null;
  const [dismissed, setDismissed] = useState(() => {
    if (!cleanupAt) {
      return false;
    }
    try {
      return localStorage.getItem(dismissKey(groupId, cleanupAt)) === "1";
    } catch {
      return false; // אחסון חסום — פשוט לא זוכרים סגירה
    }
  });

  if (!cleanupAt || dismissed) {
    return null;
  }
  const days = daysUntil(cleanupAt);
  if (days < 0 || days > WARNING_DAYS) {
    return null; // מציגים רק בחלון של שבועיים לפני
  }

  function handleDismiss() {
    try {
      localStorage.setItem(dismissKey(groupId, cleanupAt), "1");
    } catch {
      // אחסון חסום — לפחות נסגור לזמן הצפייה הנוכחית
    }
    setDismissed(true);
  }

  const dateLabel = new Date(cleanupAt).toLocaleDateString("he-IL");
  const whenLabel =
    days === 0 ? "היום" : days === 1 ? "מחר" : `בעוד ${days} ימים`;

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
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
      <div style={{ flex: 1 }}>
        ⚠️ נתוני השנה (תלמידים, תשלומים, הוצאות ואירועים) יימחקו אוטומטית ב־
        <strong>{dateLabel}</strong> ({whenLabel}), לקראת השנה החדשה. כדאי לשמור
        או לייצא מה שצריך לפני כן. הקטגוריות, הצוות ופרטי הגן יישמרו.
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="סגירת ההתראה"
        title="סגירה"
        style={{
          flexShrink: 0,
          border: "none",
          background: "transparent",
          color: "#c05a17",
          fontSize: 18,
          lineHeight: 1,
          cursor: "pointer",
          padding: 4,
          margin: -4,
        }}
      >
        ✕
      </button>
    </div>
  );
}

export default YearEndCleanupBanner;
