import { useEffect, useState } from "react";
import Icon from "./Icon";
import StarRating from "./StarRating";
import { getVendorReviews } from "../services/reviewsService";
import { getSupplierLeads } from "../services/leadsService";
import { getSupplierReport } from "../services/supplierReportService";
import {
  isTopRated,
  hasRating,
  averageRatingOf,
  reviewCountOf,
  reputationHint,
} from "../services/vendorReputation";

/*
  SupplierWeeklySummary — "מה קרה לאחרונה" בדף הבית של הספק. נותן לספק סיבה
  לחזור: פעימה שבועית אמיתית של הפעילות שלו — כמה פניות וביקורות חדשות הגיעו
  בשבוע האחרון, מה המוניטין שלו, וכמה צפיות ופניות נצברו בסך הכל. שבוע שקט לא
  מוצג כ"כלום" אלא כהזדמנות (טיפ מכוון). מבוסס נתונים קיימים בלבד — הביקורות
  (ציבורי, לפי vendor.id) והפניות (Pro, לפי הטוקן); צפיות/פניות סה"כ מהכרטיס.

  weekly delta של צפיות דורש נתוני שרת יומיים ויתווסף כשיהיה endpoint; עד אז
  הצפיות מוצגות כמצטבר ("סה"כ") ולא כ"השבוע", כדי לא להציג מספר שאינו אמיתי.
*/
const WEEK_MS = 7 * 86400000;

function countSince(list, sinceMs, dateKey = "createdAt") {
  if (!Array.isArray(list)) return 0;
  return list.filter((item) => {
    const t = new Date(item?.[dateKey]).getTime();
    return Number.isFinite(t) && t >= sinceMs;
  }).length;
}

function SupplierWeeklySummary({ vendor, token, onGoTo }) {
  const isPro = Boolean(vendor?.isPro);
  const vendorId = vendor?.id;
  const [newReviews, setNewReviews] = useState(0);
  const [newLeads, setNewLeads] = useState(0);
  const [newViews, setNewViews] = useState(0);

  // ביקורות חדשות השבוע — קריאה ציבורית לפי מזהה הספק
  useEffect(() => {
    if (!vendorId) return undefined;
    let cancelled = false;
    const since = Date.now() - WEEK_MS;
    getVendorReviews(vendorId)
      .then((list) => {
        if (!cancelled) setNewReviews(countSince(list, since));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  // צפיות ב-7 הימים האחרונים — מהדוח (מבוסס ספירה יומית בשרת), לפי הטוקן
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    getSupplierReport(token)
      .then((report) => {
        if (!cancelled) setNewViews(Number(report?.views?.inLast7Days) || 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  // פניות חדשות השבוע — רק לספק פרו (לאחרים תיבת הפניות חסומה ממילא)
  useEffect(() => {
    if (!isPro || !token) return undefined;
    let cancelled = false;
    const since = Date.now() - WEEK_MS;
    getSupplierLeads(token)
      .then((list) => {
        if (!cancelled) setNewLeads(countSince(list, since));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, isPro]);

  const views = Number(vendor?.views) || 0;
  const leads = Number(vendor?.leads) || 0;
  const avg = averageRatingOf(vendor);
  const count = reviewCountOf(vendor);
  const top = isTopRated(vendor);
  const hint = reputationHint(vendor);

  // אירועי "השבוע" שבאמת קרו — כל אחד מוצג רק אם > 0
  const highlights = [];
  if (newViews > 0) {
    highlights.push({
      key: "views",
      icon: "👀",
      text: `${newViews} ${newViews === 1 ? "צפייה" : "צפיות"} בקטלוג השבוע`,
      go: "preview",
    });
  }
  if (newLeads > 0) {
    highlights.push({
      key: "leads",
      icon: "📨",
      text: `${newLeads} ${newLeads === 1 ? "פנייה חדשה" : "פניות חדשות"} השבוע`,
      go: "home",
    });
  }
  if (newReviews > 0) {
    highlights.push({
      key: "reviews",
      icon: "⭐",
      text: `${newReviews} ${
        newReviews === 1 ? "ביקורת חדשה" : "ביקורות חדשות"
      } השבוע`,
      go: "preview",
    });
  }

  return (
    <div className="sup-summary">
      <div className="sup-summary__head">
        <Icon name="bell" size={18} />
        <h3 className="sup-summary__title">מה קרה לאחרונה</h3>
      </div>

      {highlights.length > 0 ? (
        <ul className="sup-summary__news">
          {highlights.map((h) => (
            <li key={h.key} className="sup-summary__news-item">
              <span className="sup-summary__news-emoji" aria-hidden="true">
                {h.icon}
              </span>
              <span className="sup-summary__news-text">{h.text}</span>
              {onGoTo && (
                <button
                  type="button"
                  className="sup-summary__news-go"
                  onClick={() => onGoTo(h.go)}
                >
                  לצפייה »
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="sup-summary__quiet">
          שבוע שקט 🌱 — הכרטיס שלך עדיין גלוי לוועדים. טיפ: שתפו את הקטלוג
          בוואטסאפ כדי להביא עוד צפיות ופניות.
        </p>
      )}

      {/* שורת מוניטין — כוכבים + תג/עידוד */}
      {hasRating(vendor) ? (
        <div className="sup-summary__rep">
          <StarRating value={avg} size={16} />
          <span className="sup-summary__rep-num">{avg}</span>
          <span className="sup-summary__rep-count">({count})</span>
          {top && <span className="sup-summary__badge">🏆 ספק מצטיין</span>}
        </div>
      ) : null}
      {hint && <p className="sup-summary__hint">{hint}</p>}

      {/* סיכום מצטבר — צפיות ופניות סה"כ */}
      <div className="sup-summary__totals">
        <span className="sup-summary__total">
          👀 {views.toLocaleString("he-IL")} צפיות
        </span>
        <span className="sup-summary__total">
          📨 {leads.toLocaleString("he-IL")} פניות
        </span>
      </div>
    </div>
  );
}

export default SupplierWeeklySummary;
