import { useState } from "react";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import Spinner from "../../components/Spinner";
import ConfirmDialog from "../../components/ConfirmDialog";
import useApi from "../../hooks/useApi";
import {
  getTrash,
  restoreExpense,
  permanentDeleteExpense,
} from "../../services/expensesService";
import { formatShekels, formatDayMonth } from "../../services/format";
import { isActiveReadOnly } from "../../services/institutionsService";
import "../../styles/recycle-bin.css";

/*
  RecycleBin — "סל מיחזור" של הקבלות/הוצאות. כל מחיקה היא רכה: הפריט עובר לכאן
  ונשמר 30 יום, וניתן לשחזר אותו בלחיצה או למחוק לצמיתות. אחרי 30 יום שירות רקע
  בשרת מוחק אוטומטית. יושב בתחתית כרטיס הקבלות (העמוד "קבצים").
*/
const RETENTION_DAYS = 30;

// כמה ימים נשארו עד מחיקה אוטומטית לצמיתות (לפי מתי נמחק).
function daysLeft(deletedAt) {
  if (!deletedAt) return RETENTION_DAYS;
  const passed = (Date.now() - new Date(deletedAt).getTime()) / 86400000;
  return Math.max(0, Math.ceil(RETENTION_DAYS - passed));
}

function RecycleBin({ onChange }) {
  const readOnly = isActiveReadOnly();
  const { data: items, isLoading, reload } = useApi(getTrash);
  const [open, setOpen] = useState(false);
  const [purging, setPurging] = useState(null);

  const list = items || [];

  function toggle() {
    const next = !open;
    setOpen(next);
    // רענון בכל פתיחה — לתפוס פריטים שנמחקו זה עתה בכרטיס הקבלות
    if (next) reload();
  }

  async function handleRestore(item) {
    await restoreExpense(item.id);
    reload();
    onChange?.(); // הפריט חזר — לרענן גם את רשימת הקבלות הפעילות
  }

  async function handlePurge() {
    await permanentDeleteExpense(purging.id);
    setPurging(null);
    reload();
  }

  return (
    <div className="recycle-bin">
      <button type="button" className="recycle-bin__toggle" onClick={toggle}>
        <Icon name="trash" size={16} />
        <span>סל מיחזור{list.length ? ` (${list.length})` : ""}</span>
        <span className="recycle-bin__chevron" aria-hidden="true">
          {open ? "⌄" : "‹"}
        </span>
      </button>

      {open && (
        <div className="recycle-bin__body">
          {isLoading && <Spinner />}

          {!isLoading && list.length === 0 && (
            <p className="recycle-bin__empty">הסל ריק — אין פריטים שנמחקו.</p>
          )}

          {!isLoading && list.length > 0 && (
            <>
              <p className="recycle-bin__hint">
                פריטים שנמחקו נשמרים כאן {RETENTION_DAYS} יום וניתן לשחזר אותם.
                אחר כך הם נמחקים לצמיתות.
              </p>
              <ul className="recycle-bin__list">
                {list.map((item) => (
                  <li key={item.id} className="recycle-bin__item">
                    {item.receiptImage ? (
                      <img
                        className="recycle-bin__thumb"
                        src={item.receiptImage}
                        alt="קבלה"
                        loading="lazy"
                      />
                    ) : (
                      <span className="recycle-bin__thumb recycle-bin__thumb--icon">
                        <Icon name="trash" size={18} />
                      </span>
                    )}
                    <div className="recycle-bin__info">
                      <span className="recycle-bin__name">
                        {item.description || "קבלה ללא שם"}
                      </span>
                      <span className="recycle-bin__meta">
                        {formatShekels(item.amount)} · נמחק{" "}
                        {formatDayMonth(item.deletedAt)}
                      </span>
                      <span className="recycle-bin__left">
                        עוד {daysLeft(item.deletedAt)} ימים בסל
                      </span>
                    </div>
                    {!readOnly && (
                      <div className="recycle-bin__actions">
                        <Button
                          variant="secondary"
                          onClick={() => handleRestore(item)}
                        >
                          <Icon name="check-circle" size={15} /> שחזור
                        </Button>
                        <button
                          type="button"
                          className="recycle-bin__purge"
                          aria-label="מחיקה לצמיתות"
                          onClick={() => setPurging(item)}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={purging !== null}
        title="מחיקה לצמיתות"
        message={
          purging
            ? `למחוק לצמיתות את "${
                purging.description || "הקבלה"
              }"? הפעולה בלתי הפיכה — לא ניתן יהיה לשחזר.`
            : ""
        }
        onConfirm={handlePurge}
        onCancel={() => setPurging(null)}
      />
    </div>
  );
}

export default RecycleBin;
