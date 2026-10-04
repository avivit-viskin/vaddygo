import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "./Card";
import { getStaff, nextBirthday } from "../services/staffService";
import { isDismissed, dismissNotice } from "../services/dismissedNotices";

/*
  BirthdayGiftNudge — דחיפה עדינה במסך הבית כשמתקרב יום הולדת של איש צוות:
  "יום הולדת לגננת בעוד 5 ימים 🎂 — מגשי אירוח ומתנות מספקים". מוביל לעמוד
  המתנות/ספקים ברגע הנכון (ימי הולדת = עוד הזדמנות רכישה לוועד, ופנייה לספק).

  צד לקוח בלבד (getStaff + nextBirthday). מוצג רק כשיש יום הולדת בטווח, וניתן
  לסגירה לכל יום-הולדת בנפרד (נזכר במכשיר). משתמש בעיצוב deals-banner המשותף.
*/
const BIRTHDAY_WINDOW_DAYS = 14;

function daysUntil(date) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date - start) / 86400000);
}

function BirthdayGiftNudge() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [, setTick] = useState(0); // רענון אחרי סגירה

  // הצוות נטען ברקע (לא מעכב את מסך הבית); כשל → פשוט לא מציגים
  useEffect(() => {
    let alive = true;
    getStaff()
      .then((list) => {
        if (alive) setStaff(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (alive) setStaff([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!staff || staff.length === 0) {
    return null;
  }

  // איש הצוות עם יום ההולדת הקרוב ביותר שבטווח
  const upcoming = staff
    .filter((m) => m.birthDate)
    .map((m) => ({ member: m, days: daysUntil(nextBirthday(m.birthDate)) }))
    .filter((x) => x.days >= 0 && x.days <= BIRTHDAY_WINDOW_DAYS)
    .sort((a, b) => a.days - b.days)[0];

  if (!upcoming) {
    return null;
  }

  const nb = nextBirthday(upcoming.member.birthDate);
  const noticeId = `birthdayGift:${upcoming.member.id}:${nb.getFullYear()}`;
  if (isDismissed(noticeId)) {
    return null;
  }

  const name = upcoming.member.fullName || upcoming.member.role || "הצוות";
  const when =
    upcoming.days <= 0
      ? "היום 🎉"
      : upcoming.days === 1
      ? "מחר"
      : `בעוד ${upcoming.days} ימים`;

  function handleDismiss() {
    dismissNotice(noticeId);
    setTick((n) => n + 1);
  }

  return (
    <Card>
      <div className="deals-banner">
        <span className="deals-banner__emoji" aria-hidden="true">
          🎂
        </span>
        <div className="deals-banner__body">
          <p className="deals-banner__title">
            יום הולדת ל{name} {when}
          </p>
          <p className="deals-banner__sub">
            מגשי אירוח ומתנות — מצאו ספק מתאים
          </p>
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

export default BirthdayGiftNudge;
