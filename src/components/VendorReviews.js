import { useState } from "react";
import StarRating from "./StarRating";
import Button from "./Button";
import { getVendorReviews, saveVendorReview } from "../services/reviewsService";
import { formatDayMonth } from "../services/format";

/*
  VendorReviews — לשונית הביקורות בכרטיס הספק. מציגה סיכום (ממוצע + מספר) שאפשר
  לפתוח: רשימת הביקורות, וכשלא readOnly (צד הוועד) גם טופס לכתיבת/עדכון ביקורת.
  רשימת הביקורות נטענת רק בפתיחה (כדי לא לשלוח בקשה לכל ספק ברשימה).
*/
function VendorReviews({ vendorId, average = 0, count = 0, readOnly = false }) {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState(null);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  function loadReviews() {
    getVendorReviews(vendorId)
      .then((list) => setReviews(Array.isArray(list) ? list : []))
      .catch(() => setReviews([]));
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && reviews === null) {
      loadReviews();
    }
  }

  async function submit() {
    if (stars < 1) {
      setError("צריך לבחור דירוג בכוכבים");
      return;
    }
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      await saveVendorReview(vendorId, { stars, text: text.trim() });
      setSavedMsg("תודה! הביקורת נשמרה 🌸");
      loadReviews();
    } catch (e) {
      setError(e.message || "לא הצלחנו לשמור את הביקורת");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="vendor-reviews">
      <button
        type="button"
        className="vendor-reviews__toggle"
        onClick={toggle}
        aria-expanded={open}
      >
        <span className="vendor-reviews__summary">
          {count > 0 ? (
            <>
              <StarRating value={average} size={16} />
              <strong>{average}</strong>
              <span className="vendor-reviews__count">({count} ביקורות)</span>
            </>
          ) : (
            <span className="vendor-reviews__count">עדיין אין ביקורות</span>
          )}
        </span>
        <span className="vendor-reviews__label">
          ביקורות {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="vendor-reviews__body">
          {!readOnly && (
            <div className="vendor-reviews__form">
              <p className="vendor-reviews__form-title">
                דירגו את הספק (הדירוג שלכם מעודכן בכל שליחה):
              </p>
              <StarRating value={stars} onChange={setStars} size={30} />
              <textarea
                className="vendor-reviews__text"
                rows={2}
                placeholder="מה חשבתם על הספק? (לא חובה)"
                value={text}
                maxLength={600}
                onChange={(e) => setText(e.target.value)}
              />
              {error && <p className="field__error">{error}</p>}
              {savedMsg && <p className="vendor-reviews__saved">{savedMsg}</p>}
              <Button onClick={submit} isLoading={saving}>
                שליחת ביקורת
              </Button>
            </div>
          )}

          {reviews === null ? (
            <p className="vendor-reviews__loading">טוען ביקורות…</p>
          ) : reviews.length === 0 ? (
            <p className="vendor-reviews__empty">
              עדיין אין ביקורות{!readOnly ? " — כתבו ראשונים!" : ""}
            </p>
          ) : (
            <ul className="vendor-reviews__list">
              {reviews.map((r) => (
                <li key={r.id} className="vendor-reviews__item">
                  <div className="vendor-reviews__item-head">
                    <StarRating value={r.stars} size={14} />
                    <span className="vendor-reviews__author">{r.authorName}</span>
                    <span className="vendor-reviews__date">
                      {formatDayMonth(r.createdAt)}
                    </span>
                  </div>
                  {r.text && (
                    <p className="vendor-reviews__item-text">{r.text}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default VendorReviews;
