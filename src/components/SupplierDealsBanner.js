import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "./Card";
import { nextHoliday } from "../services/upcomingHoliday";
import { holidayEmoji } from "../data/holidays";
import { getVendors } from "../services/vendorsService";
import { isDismissed, dismissNotice } from "../services/dismissedNotices";

/*
  SupplierDealsBanner — דחיפה עדינה במסך הבית לקראת חג: "חנוכה בעוד 18 יום —
  6 ספקים עם מבצעים למתנות ומגשי אירוח". החגים הם שיא הרכישות של הוועד, וזה
  המקום לתפוס את הוועד בכניסה לאפליקציה ולהוביל אותו לספקים (מקור ההכנסה של
  VaddyGo — יותר פניות לספקים = יותר סיבה לספקים לשלם על פרו).

  צד לקוח בלבד: לוח החגים (upcomingHoliday) ורשימת הספקים (getVendors). מוצג רק
  כשחג בטווח, ויש ספקים; ניתן לסגירה לכל חג בנפרד (נזכר במכשיר, כמו הספירה).
*/
// כמה ימים לפני החג מתחילים לקדם ספקים (חלון רכישות סביר)
const DEALS_WINDOW_DAYS = 45;

function SupplierDealsBanner() {
  const navigate = useNavigate();
  const holiday = nextHoliday();
  const [vendors, setVendors] = useState(null);
  const noticeId = holiday ? `supplierDeals:${holiday.key}` : "";
  const [hidden, setHidden] = useState(() =>
    holiday ? isDismissed(noticeId) : false
  );

  // רשימת הספקים נטענת ברקע (לא מעכב את מסך הבית); כשל → פשוט לא מציגים
  useEffect(() => {
    let alive = true;
    getVendors()
      .then((list) => {
        if (alive) setVendors(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (alive) setVendors([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!holiday || hidden || holiday.daysUntil > DEALS_WINDOW_DAYS) {
    return null;
  }
  // עד שהספקים נטענים (null) או כשאין ספקים — לא מציגים כלום
  if (!vendors || vendors.length === 0) {
    return null;
  }

  const withOffer = vendors.filter((v) => (v.offer || "").trim()).length;
  const emoji = holidayEmoji(holiday.name) || "🎁";
  const when =
    holiday.daysUntil <= 0
      ? "היום"
      : holiday.daysUntil === 1
      ? "מחר"
      : `בעוד ${holiday.daysUntil} ימים`;
  // אם יש מבצעים בפועל — מדגישים אותם; אחרת מקדמים את הספקים עצמם
  const lead =
    withOffer > 0
      ? `${withOffer} ספקים עם מבצעים למתנות ולמגשי אירוח`
      : `${vendors.length} ספקים מחכים עם מתנות ומגשי אירוח`;

  function handleDismiss() {
    dismissNotice(noticeId);
    setHidden(true);
  }

  return (
    <Card>
      <div className="deals-banner">
        <span className="deals-banner__emoji" aria-hidden="true">
          {emoji}
        </span>
        <div className="deals-banner__body">
          <p className="deals-banner__title">
            {holiday.name} {when} 🎉
          </p>
          <p className="deals-banner__sub">{lead}</p>
        </div>
        <div className="deals-banner__actions">
          <button
            type="button"
            className="deals-banner__cta"
            onClick={() => navigate("/gifts")}
          >
            לספקים ←
          </button>
          <button
            type="button"
            className="deals-banner__close"
            aria-label="הסתרה"
            onClick={handleDismiss}
          >
            ✕
          </button>
        </div>
      </div>
    </Card>
  );
}

export default SupplierDealsBanner;
