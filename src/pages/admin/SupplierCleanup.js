import { useCallback, useState } from "react";
import useApi from "../../hooks/useApi";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import Spinner from "../../components/Spinner";
import ErrorMessage from "../../components/ErrorMessage";
import { getVendors, deleteVendor } from "../../services/vendorsService";
import "../../styles/supplier-cleanup.css";

/*
  SupplierCleanup — כלי SuperAdmin לניקוי נתוני בדיקה מדוח השימוש: רשימת כל
  הספקים במערכת עם מחיקה — לכל ספק בנפרד, או *בחירה מרובה* (סימון כמה ומחיקה
  בבת אחת). כך אפשר להשאיר רק את הספקים האמיתיים, והמספרים בדוח למעלה מתעדכנים.

  משתמש ב-endpoints הקיימים (GET /api/vendors + DELETE /api/vendors/{id}),
  שמוגנים בשרת ב-SuperAdmin. אין נפילה מקומית — מחיקה היא שרת בלבד, ובלתי-הפיכה.
*/
function SupplierCleanup() {
  const fetcher = useCallback(() => getVendors(), []);
  const { data, isLoading, error, reload } = useApi(fetcher);
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const vendors = Array.isArray(data) ? data : [];
  const allSelected = vendors.length > 0 && vendors.every((v) => selected.has(v.id));

  function toggleSelected(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMsg(null);
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(vendors.map((v) => v.id)));
    setMsg(null);
  }

  async function handleDelete(id) {
    setBusyId(id);
    setMsg(null);
    try {
      await deleteVendor(id);
      setConfirmId(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await reload();
      setMsg({ ok: true, text: "הספק נמחק. הדוח למעלה יתעדכן בהתאם." });
    } catch (err) {
      setMsg({ ok: false, text: err.message || "לא הצלחנו למחוק. נסו שוב." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleBulkDelete() {
    const ids = vendors.filter((v) => selected.has(v.id)).map((v) => v.id);
    setBulkBusy(true);
    setMsg(null);
    let ok = 0;
    let fail = 0;
    // מוחקים אחד-אחד (רצף) כדי לא להציף את השרת בהרבה בקשות בבת אחת
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
        ? { ok: true, text: `נמחקו ${ok} ספקים. הדוח למעלה יתעדכן בהתאם.` }
        : { ok: false, text: `נמחקו ${ok}, ${fail} נכשלו. אפשר לנסות שוב.` }
    );
  }

  return (
    <div className="supplier-cleanup">
      <h3 className="supplier-cleanup__title">
        <Icon name="trash" size={18} /> ניקוי נתוני ספקים
      </h3>
      <p className="supplier-cleanup__hint">
        אפשר למחוק ספק בודד, או לסמן כמה ספקים ולמחוק אותם בבת אחת — כדי שהדוח
        למעלה יראה רק את הספקים האמיתיים. מחיקה היא סופית, אי אפשר לשחזר.
      </p>

      {isLoading && <Spinner />}
      {!isLoading && error && <ErrorMessage message={error} />}
      {msg && (
        <p
          className={msg.ok ? "supplier-cleanup__ok" : "field__error"}
          role="status"
        >
          {msg.ok ? "✓ " : ""}
          {msg.text}
        </p>
      )}

      {!isLoading &&
        !error &&
        (vendors.length === 0 ? (
          <p className="supplier-cleanup__empty">אין ספקים במערכת.</p>
        ) : (
          <>
            {/* שורת בחירה מרובה — בחירת הכל ומחיקת הנבחרים */}
            <div className="supplier-cleanup__bulk">
              <label className="supplier-cleanup__selectall">
                <input
                  type="checkbox"
                  className="supplier-cleanup__check"
                  checked={allSelected}
                  onChange={toggleAll}
                />
                בחירת הכל ({vendors.length})
              </label>
              {selected.size > 0 &&
                (bulkConfirm ? (
                  <div className="supplier-cleanup__confirm">
                    <span className="supplier-cleanup__confirm-q">
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
                  </div>
                ) : (
                  <Button
                    variant="danger"
                    onClick={() => {
                      setBulkConfirm(true);
                      setMsg(null);
                    }}
                  >
                    <Icon name="trash" size={15} /> מחיקת הנבחרים ({selected.size})
                  </Button>
                ))}
            </div>

            <ul className="supplier-cleanup__list">
              {vendors.map((v) => {
                const count = (v.products || []).length;
                return (
                  <li key={v.id} className="supplier-cleanup__item">
                    <input
                      type="checkbox"
                      className="supplier-cleanup__check"
                      checked={selected.has(v.id)}
                      onChange={() => toggleSelected(v.id)}
                      aria-label={`בחירת ${v.name || "ספק"}`}
                    />
                    <div className="supplier-cleanup__info">
                      <span className="supplier-cleanup__name">
                        {v.name || "ללא שם"}
                      </span>
                      <span className="supplier-cleanup__meta">
                        {v.category || "בלי קטגוריה"} · {count} מוצרים
                      </span>
                    </div>
                    {confirmId === v.id ? (
                      <div className="supplier-cleanup__confirm">
                        <span className="supplier-cleanup__confirm-q">
                          למחוק סופית?
                        </span>
                        <Button
                          variant="danger"
                          isLoading={busyId === v.id}
                          onClick={() => handleDelete(v.id)}
                        >
                          כן, מחק
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setConfirmId(null)}
                        >
                          ביטול
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setConfirmId(v.id);
                          setMsg(null);
                        }}
                      >
                        <Icon name="trash" size={15} /> מחיקה
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        ))}
    </div>
  );
}

export default SupplierCleanup;
