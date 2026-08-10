import { useCallback, useState } from "react";
import useApi from "../../hooks/useApi";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import Spinner from "../../components/Spinner";
import ErrorMessage from "../../components/ErrorMessage";
import {
  getSubscriptions,
  subscriptionStatus,
  validUntilText,
} from "../../services/subscriptionsService";
import { deleteVendor } from "../../services/vendorsService";
import "../../styles/subscriptions.css";

/*
  SubscriptionsCard — מי משלם ל-VaddyGo ועד מתי, בשני ערוצי ההכנסה (ועדים
  וספקים). נועד לשאלה עסקית אחת: מה פעיל עכשיו ומה עומד לפוג — כדי שאפשר
  יהיה לפנות ללקוח לפני שהמנוי נסגר, ולא אחרי.

  הסטטוס (פעיל / פג בקרוב / פג / לא מנוי) מחושב **בשרת**, כדי שלא ייווצר מצב
  שהמסך מראה "פעיל" בזמן שהשרת כבר חוסם את הפיצ'רים.

  בערוץ הספקים אפשר גם לבחור כמה ולמחוק אותם בבת אחת (ניקוי נתוני בדיקה). גנים
  (ועדי הורים) אינם ניתנים למחיקה מכאן — מחיקת גן היא הרסנית ומחוץ למסך הזה.
*/
function SubscriptionList({ title, icon, rows, selected, onToggle }) {
  const selectable = typeof onToggle === "function";
  if (!rows || rows.length === 0) {
    return (
      <section className="subs__group">
        <h4 className="subs__group-title">
          <Icon name={icon} size={16} /> {title}
        </h4>
        <p className="subs__empty">אין עדיין רשומות להצגה.</p>
      </section>
    );
  }

  return (
    <section className="subs__group">
      <h4 className="subs__group-title">
        <Icon name={icon} size={16} /> {title} ({rows.length})
      </h4>
      <ul className="subs__list">
        {rows.map((row) => {
          const status = subscriptionStatus(row.status);
          return (
            <li key={row.id} className="subs__row">
              {selectable && (
                <input
                  type="checkbox"
                  className="subs__check"
                  checked={selected.has(row.id)}
                  onChange={() => onToggle(row.id)}
                  aria-label={`בחירת ${row.name || "ספק"}`}
                />
              )}
              <span className="subs__name">{row.name}</span>
              <span className={`subs__pill subs__pill--${status.tone}`}>
                {status.label}
              </span>
              <span className="subs__until">{validUntilText(row)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SubscriptionsCard() {
  const { data, isLoading, error, reload } = useApi(
    useCallback(() => getSubscriptions(), [])
  );
  const [selected, setSelected] = useState(() => new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const suppliers =
    data && Array.isArray(data.suppliers) ? data.suppliers : [];

  function toggleSelected(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMsg(null);
  }

  async function handleBulkDelete() {
    const ids = suppliers.filter((s) => selected.has(s.id)).map((s) => s.id);
    setBulkBusy(true);
    setMsg(null);
    let ok = 0;
    let fail = 0;
    // מוחקים ברצף כדי לא להציף את השרת בהרבה בקשות בבת אחת
    for (const id of ids) {
      try {
        await deleteVendor(id);
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    setBulkConfirm(false);
    setSelected(new Set());
    await reload();
    setBulkBusy(false);
    setMsg(
      fail === 0
        ? { ok: true, text: `נמחקו ${ok} ספקים. הרשימה עודכנה.` }
        : { ok: false, text: `נמחקו ${ok}, ${fail} נכשלו. אפשר לנסות שוב.` }
    );
  }

  return (
    <section className="subs">
      <h3 className="subs__title">
        <Icon name="wallet" size={18} /> מנויים — מי משלם ועד מתי
      </h3>

      {isLoading && <Spinner />}
      {!isLoading && error && <ErrorMessage message={error} />}

      {!isLoading && !error && data && (
        <>
          <p className="subs__summary">
            <strong>{data.activeCount}</strong> מנויים פעילים
            {data.expiringSoonCount > 0 && (
              <>
                {" · "}
                <span className="subs__warn">
                  {data.expiringSoonCount} פגים בתוך 30 יום
                </span>
              </>
            )}
          </p>

          <SubscriptionList
            title="ועדי הורים"
            icon="users"
            rows={data.committees}
          />
          <SubscriptionList
            title="ספקים"
            icon="tag"
            rows={data.suppliers}
            selected={selected}
            onToggle={toggleSelected}
          />

          {/* בחירה מרובה — מחיקת ספקים נבחרים בלבד (גנים אינם נמחקים מכאן) */}
          {msg && (
            <p
              className={msg.ok ? "subs__ok" : "field__error"}
              role="status"
            >
              {msg.ok ? "✓ " : ""}
              {msg.text}
            </p>
          )}
          {selected.size > 0 && (
            <div className="subs__bulk">
              {bulkConfirm ? (
                <>
                  <span className="subs__confirm-q">
                    למחוק {selected.size} ספקים סופית?
                  </span>
                  <Button
                    variant="danger"
                    isLoading={bulkBusy}
                    onClick={handleBulkDelete}
                  >
                    כן, מחק {selected.size}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setBulkConfirm(false)}
                  >
                    ביטול
                  </Button>
                </>
              ) : (
                <Button
                  variant="danger"
                  onClick={() => {
                    setBulkConfirm(true);
                    setMsg(null);
                  }}
                >
                  <Icon name="trash" size={15} /> מחיקת הספקים הנבחרים (
                  {selected.size})
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default SubscriptionsCard;
