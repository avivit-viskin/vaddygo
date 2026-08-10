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
  הספקים במערכת עם מחיקה לכל אחד (עם אישור). כך אפשר להשאיר רק את הספקים
  האמיתיים, והמספרים בדוח למעלה מתעדכנים בהתאם.

  משתמש ב-endpoints הקיימים (GET /api/vendors + DELETE /api/vendors/{id}),
  שמוגנים בשרת ב-SuperAdmin. אין נפילה מקומית — פעולת מחיקה היא שרת בלבד,
  ובלתי-הפיכה.
*/
function SupplierCleanup() {
  const fetcher = useCallback(() => getVendors(), []);
  const { data, isLoading, error, reload } = useApi(fetcher);
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState(null);

  const vendors = Array.isArray(data) ? data : [];

  async function handleDelete(id) {
    setBusyId(id);
    setMsg(null);
    try {
      await deleteVendor(id);
      setConfirmId(null);
      await reload();
      setMsg({ ok: true, text: "הספק נמחק. הדוח למעלה יתעדכן בהתאם." });
    } catch (err) {
      setMsg({ ok: false, text: err.message || "לא הצלחנו למחוק. נסו שוב." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="supplier-cleanup">
      <h3 className="supplier-cleanup__title">
        <Icon name="trash" size={18} /> ניקוי נתוני ספקים
      </h3>
      <p className="supplier-cleanup__hint">
        כאן אפשר למחוק ספקים שנוצרו לבדיקה, כדי שהדוח למעלה יראה רק את הספקים
        האמיתיים. מחיקה היא סופית — אי אפשר לשחזר.
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
            <p className="supplier-cleanup__count">
              סה״כ {vendors.length} ספקים במערכת
            </p>
            <ul className="supplier-cleanup__list">
              {vendors.map((v) => {
                const count = (v.products || []).length;
                return (
                  <li key={v.id} className="supplier-cleanup__item">
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
