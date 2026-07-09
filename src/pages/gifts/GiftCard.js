import { formatShekels } from "../../services/format";
import { giftStatusLabel } from "../../services/giftStatus";

/*
  GiftCard — מתנה אחת ברשימה (UI_SPEC ס' 12):
  "מתנת ראש השנה — סה"כ 800 ₪ [בוצע]", עם אירוע, ספק, ועריכה/מחיקה.
*/
function GiftCard({ gift, vendorName, onEdit, onDelete, onOpenVendor }) {
  return (
    <div className="gift-card">
      <div className="gift-card__main">
        <span className="gift-card__name">{gift.name}</span>
        <span className={`gift-card__status gift-card__status--${gift.status}`}>
          {giftStatusLabel(gift.status)}
        </span>
      </div>

      <div className="gift-card__meta">
        <span className="gift-card__amount">{formatShekels(gift.totalAmount)}</span>
        {gift.holidayName && (
          <span className="gift-card__holiday">· {gift.holidayName}</span>
        )}
        {vendorName && (
          <button
            type="button"
            className="gift-card__vendor"
            onClick={onOpenVendor}
          >
            🏷️ {vendorName}
          </button>
        )}
      </div>

      <div className="gift-card__actions">
        <button
          type="button"
          className="gift-card__action"
          aria-label={`עריכת ${gift.name}`}
          onClick={onEdit}
        >
          ✏️
        </button>
        <button
          type="button"
          className="gift-card__action"
          aria-label={`מחיקת ${gift.name}`}
          onClick={onDelete}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default GiftCard;
