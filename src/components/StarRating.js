/*
  StarRating — חמישה כוכבים. לתצוגה (value בלבד) או להזנה (עם onChange —
  לחיצה על כוכב קובעת דירוג). מלא = ★, ריק = ☆; הצבע הזהוב מ-CSS.
*/
function StarRating({ value = 0, onChange, size = 20 }) {
  const interactive = typeof onChange === "function";
  const rounded = Math.round(Number(value) || 0);

  return (
    <span
      className={`stars${interactive ? " stars--input" : ""}`}
      role="img"
      aria-label={`דירוג ${rounded} מתוך 5`}
      style={{ fontSize: size }}
    >
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = s <= rounded;
        if (interactive) {
          return (
            <button
              key={s}
              type="button"
              className={`stars__btn${s <= value ? " is-on" : ""}`}
              aria-label={`${s} כוכבים`}
              onClick={() => onChange(s)}
            >
              {s <= value ? "★" : "☆"}
            </button>
          );
        }
        return (
          <span key={s} className={`stars__star${filled ? " is-on" : ""}`} aria-hidden="true">
            {filled ? "★" : "☆"}
          </span>
        );
      })}
    </span>
  );
}

export default StarRating;
