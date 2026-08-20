import { useCallback, useEffect, useState } from "react";
import {
  getSupplierReport,
  presetRanges,
} from "../services/supplierReportService";
import "../styles/supplier-report.css";

/*
  SupplierReportRange — החלק בדוח הספק שתלוי בתקופה, ובנוסף המידע שלא היה קיים
  קודם: המיקום ברשימה שהוועדים רואים, מתי הכרטיס נערך לאחרונה, ומתי נוסף
  המוצר האחרון.

  שלוש החלטות שמעצבות את המסך:

  1. **טווח מוכן בלחיצה אחת.** הבקשה הייתה להשוות שנה לשנה; אילוץ הספק למלא
     ארבעה שדות תאריך בכל השוואה היה הופך את התכונה למשהו שלא משתמשים בו.
     השנים הן שנות פעילות (ספטמבר–אוגוסט), כי זו השנה שהוועדים עובדים לפיה.

  2. **הצפיות אומרות ממתי הן נספרות.** הספירה היומית התחילה עכשיו; בלעדיה
     אי אפשר לפצל צפיות לתקופות. תקופה שקודמת לתחילת הספירה תציג 0 — ו-0
     בלי הסבר נראה כמו "אף אחד לא נכנס אליך", שזו מסקנה שגויה.

  3. **המיקום מחושב באותו סדר שהוועד רואה בפועל** (מקודמים ואז א׳-ב׳), אחרת
     המספר לא יתאים למה שהספק רואה כשהוא פותח את הרשימה בעצמו.
*/
function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString("he-IL");
  } catch {
    return null;
  }
}

/* "לפני 3 ימים" — קל יותר לתפוס מאשר תאריך, כשהשאלה היא "מתי לאחרונה". */
function relativeDays(value) {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return null;
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return "היום";
  if (days === 1) return "אתמול";
  if (days < 30) return `לפני ${days} ימים`;
  const months = Math.floor(days / 30);
  return months === 1 ? "לפני חודש" : `לפני ${months} חודשים`;
}

function SupplierReportRange({ token }) {
  const presets = presetRanges();
  const [range, setRange] = useState({
    from: presets[0].from,
    to: presets[0].to,
    key: presets[0].key,
  });
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(
    async (from, to) => {
      if (!token) return;
      setIsLoading(true);
      setError("");
      try {
        setReport(await getSupplierReport(token, { from, to }));
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load(range.from, range.to);
  }, [load, range.from, range.to]);

  function applyPreset(preset) {
    setRange({ from: preset.from, to: preset.to, key: preset.key });
  }

  function applyCustom(field, value) {
    setRange((prev) => ({ ...prev, [field]: value, key: "custom" }));
  }

  const views = report?.views;
  const leads = report?.leads;
  const products = report?.products;
  const placement = report?.placement;

  return (
    <div className="sup-range">
      <h4 className="sup-range__title">תקופה להצגה</h4>

      <div className="sup-range__presets">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`sup-range__chip${
              range.key === p.key ? " sup-range__chip--on" : ""
            }`}
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="sup-range__dates">
        <label className="sup-range__field">
          <span>מתאריך</span>
          <input
            type="date"
            value={range.from}
            onChange={(e) => applyCustom("from", e.target.value)}
          />
        </label>
        <label className="sup-range__field">
          <span>עד תאריך</span>
          <input
            type="date"
            value={range.to}
            onChange={(e) => applyCustom("to", e.target.value)}
          />
        </label>
      </div>

      {error && <p className="sup-range__error">{error}</p>}
      {isLoading && <p className="sup-range__muted">טוען…</p>}

      {!isLoading && !error && report && (
        <>
          <div className="sup-range__tiles">
            <div className="sup-range__tile">
              <div className="sup-range__num">{views?.inRange ?? 0}</div>
              <div className="sup-range__label">צפיות בתקופה</div>
            </div>
            <div className="sup-range__tile">
              <div className="sup-range__num">{leads?.inRange ?? 0}</div>
              <div className="sup-range__label">פניות בתקופה</div>
            </div>
            <div className="sup-range__tile">
              <div className="sup-range__num">{products?.addedInRange ?? 0}</div>
              <div className="sup-range__label">מוצרים שנוספו</div>
            </div>
          </div>

          {/*
            בלי המשפט הזה, תקופה שקודמת לתחילת הספירה מציגה 0 צפיות — ומי
            שיקרא את זה יסיק שלא נכנסו אליו, במקום שלא נמדד.
          */}
          {views?.rangeStartsBeforeTracking && (
            <p className="sup-range__note">
              ספירת הצפיות לפי תאריך התחילה
              {views.trackedSince ? ` ב-${formatDate(views.trackedSince)}` : " עכשיו"}.
              לתקופה שלפני כן אין פירוט יומי — סך הצפיות מאז ומעולם הוא{" "}
              <strong>{views?.total ?? 0}</strong>.
            </p>
          )}

          <h4 className="sup-range__title">המיקום שלך ברשימה</h4>
          {placement?.rank > 0 ? (
            <ul className="sup-range__facts">
              <li>
                באזור <strong>{placement.area}</strong> אתם מופיעים במקום{" "}
                <strong>{placement.rank}</strong> מתוך {placement.outOf}
              </li>
              {placement.rankInCategory > 0 && (
                <li>
                  בקטגוריית <strong>{placement.category}</strong> באזור:
                  מקום <strong>{placement.rankInCategory}</strong> מתוך{" "}
                  {placement.outOfInCategory}
                </li>
              )}
              <li className="sup-range__muted">
                {placement.featured
                  ? "הכרטיס מסומן כמומלץ ולכן מופיע לפני האחרים."
                  : "הסדר הוא לפי א׳-ב׳; ספקים מומלצים מופיעים לפניכם."}
              </li>
            </ul>
          ) : (
            <p className="sup-range__note">
              לא הוגדר אזור בכרטיס, ולכן אי אפשר לחשב מיקום. הוספת עיר בפרטי
              העסק תציג לכם את המיקום ותעזור לוועדים באזור למצוא אתכם.
            </p>
          )}

          <h4 className="sup-range__title">עדכון אחרון</h4>
          <ul className="sup-range__facts">
            <li>
              עריכת הכרטיס:{" "}
              {report.lastEditedAt ? (
                <strong>
                  {formatDate(report.lastEditedAt)} ({relativeDays(report.lastEditedAt)})
                </strong>
              ) : (
                <span className="sup-range__muted">לא נערך מאז ההוספה</span>
              )}
            </li>
            <li>
              הוספת מוצר:{" "}
              {products?.lastAddedAt ? (
                <strong>
                  {formatDate(products.lastAddedAt)} (
                  {relativeDays(products.lastAddedAt)})
                </strong>
              ) : (
                <span className="sup-range__muted">אין תאריך למוצרים הקיימים</span>
              )}
            </li>
            {products?.withoutDate > 0 && (
              <li className="sup-range__muted">
                ל-{products.withoutDate} מוצרים אין תאריך הוספה — הם נוספו לפני
                שהמערכת התחילה לתעד זאת.
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}

export default SupplierReportRange;
