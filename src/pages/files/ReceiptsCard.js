import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import ConfirmDialog from "../../components/ConfirmDialog";
import ProBadge from "../../components/ProBadge";
import useApi from "../../hooks/useApi";
import { getExpenses, deleteExpense } from "../../services/expensesService";
import { paymentMethodLabel } from "../../services/paymentMethods";
import { formatShekels, formatDayMonth } from "../../services/format";
import { isActiveReadOnly } from "../../services/institutionsService";
import ReceiptCaptureModal from "./ReceiptCaptureModal";
import "../../styles/receipts.css";

/*
  ReceiptsCard — כרטיס "קבלות והוצאות" בעמוד הקבצים. הקבלות מסודרות ב*תיקיות
  לפי קטגוריה*: לחיצה על תיקייה פותחת את הקבלות של אותה קטגוריה. בכל תצוגה
  מוצגות לכל היותר 4 קבלות (האחרונות) — לבקשת בעלת המוצר. לכל קבלה אפשר לתת
  "שם לתצוגה" (נשמר בשדה הפירוט של ההוצאה). כל קבלה היא הוצאה — ולכן כבר מקזזת
  מהיתרה הכללית ומהקטגוריה שנבחרה.
*/
// מציגים לכל היותר 4 קבלות בכל תצוגה (בלי "עוד") — לבקשת בעלת המוצר
const MAX_VISIBLE = 4;
const UNCATEGORIZED = "ללא קטגוריה";

function ReceiptsCard() {
  const readOnly = isActiveReadOnly();
  const { data: expenses, isLoading, error, reload } = useApi(getExpenses);
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState(null); // קבלה לצפייה בגדול
  const [deleting, setDeleting] = useState(null);
  const [openFolder, setOpenFolder] = useState(null); // שם הקטגוריה שנפתחה, או null
  const [showAll, setShowAll] = useState(false); // "ראה עוד" — חשיפת כל הקבלות בתיקייה

  // בכל כניסה לתיקייה מתחילים מ-4 האחרונות (ולא במצב "ראה עוד" של תיקייה קודמת)
  useEffect(() => {
    setShowAll(false);
  }, [openFolder]);

  const receipts = useMemo(
    () => (expenses || []).filter((e) => (e.receiptImage || "").trim()),
    [expenses]
  );

  // קיבוץ הקבלות לתיקיות לפי קטגוריה; כל תיקייה ממויינת מהחדש לישן
  const folders = useMemo(() => {
    const byRecent = (a, b) =>
      new Date(b.date || 0) - new Date(a.date || 0) || (b.id || 0) - (a.id || 0);
    const map = new Map();
    for (const r of receipts) {
      const cat = (r.category || "").trim() || UNCATEGORIZED;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(r);
    }
    for (const list of map.values()) list.sort(byRecent);
    return Array.from(map, ([name, items]) => ({ name, items })).sort((a, b) =>
      a.name.localeCompare(b.name, "he")
    );
  }, [receipts]);

  // התיקייה הפתוחה (אם הקטגוריה התרוקנה אחרי מחיקה — חוזרים לרשימת התיקיות)
  const current = openFolder
    ? folders.find((f) => f.name === openFolder) || null
    : null;

  async function handleDelete() {
    await deleteExpense(deleting.id);
    setDeleting(null);
    reload();
  }

  function renderReceipt(r) {
    return (
      <li key={r.id} className="receipts__item">
        <button
          type="button"
          className="receipts__thumb-btn"
          onClick={() => setViewing(r)}
          aria-label="צפייה בקבלה"
        >
          <img
            className="receipts__thumb"
            src={r.receiptImage}
            alt="קבלה"
            loading="lazy"
          />
        </button>
        <div className="receipts__info">
          <span
            className={`receipts__name${
              r.description ? "" : " receipts__name--empty"
            }`}
          >
            {r.description || "קבלה ללא שם"}
          </span>
          <span className="receipts__amount">{formatShekels(r.amount)}</span>
          <span className="receipts__date">{formatDayMonth(r.date)}</span>
        </div>
        {!readOnly && (
          <button
            type="button"
            className="receipts__delete"
            aria-label="מחיקת קבלה"
            onClick={() => setDeleting(r)}
          >
            <Icon name="trash" size={16} />
          </button>
        )}
      </li>
    );
  }

  return (
    <Card
      title={
        <>
          <span aria-hidden="true">🧾</span> קבלות והוצאות{" "}
          <ProBadge title="ניהול קבלות — פיצ'ר פרו" />
        </>
      }
    >
      <p className="files__hint">
        מצלמים קבלה או בוחרים תמונה מהגלריה, רושמים כמה כסף יצא ומאיזו קטגוריה —
        וזה מתעדכן <strong>אוטומטית</strong> ביתרה הכללית ובקטגוריה. הקבלות
        מסודרות בתיקיות לפי קטגוריה.
      </p>

      {isLoading && <Spinner />}
      {!isLoading && error && <ErrorMessage message={error} onRetry={reload} />}

      {!isLoading && !error && receipts.length === 0 && (
        <EmptyState icon="🧾" message="עדיין אין קבלות — נצלם את הראשונה?" />
      )}

      {/* רמה ראשונה: תיקיות לפי קטגוריה */}
      {!isLoading && !error && receipts.length > 0 && !current && (
        <ul className="receipt-folders">
          {folders.map((f) => (
            <li key={f.name}>
              <button
                type="button"
                className="receipt-folders__item"
                onClick={() => setOpenFolder(f.name)}
              >
                <span className="receipt-folders__icon" aria-hidden="true">
                  <Icon name="folder" size={18} />
                </span>
                <span className="receipt-folders__name">{f.name}</span>
                <span className="receipt-folders__count">
                  {f.items.length} קבלות
                </span>
                <span className="receipt-folders__chevron" aria-hidden="true">
                  ‹
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* תיקייה פתוחה: 4 הקבלות האחרונות, ו"ראה עוד" לחשיפת השאר */}
      {!isLoading && !error && current && (
        <div>
          <button
            type="button"
            className="receipts__back"
            onClick={() => setOpenFolder(null)}
          >
            ‹ חזרה לתיקיות
          </button>
          <h3 className="receipts__folder-title">
            <Icon name="folder" size={18} /> {current.name}
          </h3>
          <ul className="receipts">
            {(showAll
              ? current.items
              : current.items.slice(0, MAX_VISIBLE)
            ).map(renderReceipt)}
          </ul>
          {current.items.length > MAX_VISIBLE &&
            (showAll ? (
              <button
                type="button"
                className="receipts__more-btn"
                onClick={() => setShowAll(false)}
              >
                הצג פחות
              </button>
            ) : (
              <button
                type="button"
                className="receipts__more-btn"
                onClick={() => setShowAll(true)}
              >
                ראה עוד ({current.items.length - MAX_VISIBLE})
              </button>
            ))}
        </div>
      )}

      {!readOnly && (
        <Button variant="secondary" onClick={() => setAdding(true)}>
          + הוספת קבלה
        </Button>
      )}

      <ReceiptCaptureModal
        isOpen={adding}
        onClose={() => setAdding(false)}
        onSaved={reload}
      />

      <Modal
        isOpen={viewing !== null}
        onClose={() => setViewing(null)}
        title="קבלה"
      >
        {viewing && (
          <div>
            <img
              src={viewing.receiptImage}
              alt="קבלה"
              style={{ width: "100%", borderRadius: 8 }}
            />
            {viewing.description && (
              <p style={{ marginTop: 8, fontWeight: 700 }}>
                {viewing.description}
              </p>
            )}
            <p style={{ marginTop: 6, fontWeight: 600 }}>
              {formatShekels(viewing.amount)}
              {viewing.category ? ` · ${viewing.category}` : ""} ·{" "}
              {paymentMethodLabel(viewing.method)}
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleting !== null}
        title="מחיקת קבלה"
        message={
          deleting
            ? `למחוק את הקבלה על סך ${formatShekels(
                deleting.amount
              )}? הסכום יוחזר ליתרה. אי אפשר לבטל.`
            : ""
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Card>
  );
}

export default ReceiptsCard;
