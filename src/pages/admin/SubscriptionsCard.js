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
  deleteCommittee,
  deleteIncompleteUser,
  setCommitteePro,
} from "../../services/subscriptionsService";
import { deleteVendor } from "../../services/vendorsService";
import "../../styles/subscriptions.css";

/*
  SubscriptionsCard — מי משלם ל-VaddyGo ועד מתי, בשני ערוצי ההכנסה (ועדים
  וספקים). נועד לשאלה עסקית אחת: מה פעיל עכשיו ומה עומד לפוג — כדי שאפשר
  יהיה לפנות ללקוח לפני שהמנוי נסגר, ולא אחרי.

  הסטטוס (פעיל / פג בקרוב / פג / לא מנוי) מחושב **בשרת**, כדי שלא ייווצר מצב
  שהמסך מראה "פעיל" בזמן שהשרת כבר חוסם את הפיצ'רים.

  אפשר לבחור ולמחוק בבת אחת גני-בדיקה או ספקי-בדיקה (ניקוי נתוני פיתוח). מחיקת
  גן בטוחה: השרת מוחק רק גן יחיד של חשבון רגיל, ומסרב לחשבון מנהלת או לחשבון עם
  כמה גנים — כדי לא לנעול את המנהלת ולא למחוק גן אמיתי בטעות.

  מסנן "רק פעילים" מסתיר מהתצוגה את מי שאינו משלם כרגע (פג / לא מנוי) — בלי
  למחוק כלום. ההעדפה נשמרת מקומית כדי שהתצוגה תישאר כפי שהמנהלת בחרה.
*/
// "מנוי פעיל" = משלם עכשיו (פעיל + פג בקרוב). השאר (פג / לא מנוי) = לא פעיל.
const ACTIVE_STATUSES = ["active", "expiring"];
const SUBS_FILTER_KEY = "vaadygo.subs.activeOnly";

function SubscriptionList({ title, icon, rows, selected, onToggle, onSetPro, proBusyId }) {
  const selectable = typeof onToggle === "function";
  const canSetPro = typeof onSetPro === "function";
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
              {row.email && (
                <a
                  className="subs__email"
                  href={`mailto:${row.email}`}
                  title="מייל הרשמה"
                >
                  {row.email}
                </a>
              )}
              {row.phone && (
                <a className="subs__phone" href={`tel:${row.phone}`} title="טלפון">
                  ☎ {row.phone}
                </a>
              )}
              <span className={`subs__pill subs__pill--${status.tone}`}>
                {status.label}
              </span>
              {row.createdAt && (
                <span className="subs__created" title="תאריך הצטרפות">
                  נרשם {new Date(row.createdAt).toLocaleDateString("he-IL")}
                </span>
              )}
              <span className="subs__until">{validUntilText(row)}</span>
              {/*
                פתיחה/סגירה ידנית של פרו לגן. עד עכשיו פרו לוועד נפתח רק
                אוטומטית אחרי תשלום — ולא הייתה דרך לתת אותו לגן פיילוט או
                ללקוחה שמשלמת בהעברה.
              */}
              {canSetPro && (
                <button
                  type="button"
                  className={`subs__pro-btn${
                    row.isPro ? " subs__pro-btn--on" : ""
                  }`}
                  disabled={proBusyId === row.id}
                  onClick={() => onSetPro(row)}
                  title={
                    row.isPro
                      ? "סגירת מסלול פרו לגן הזה"
                      : "פתיחת מסלול פרו לשנה לגן הזה"
                  }
                >
                  {proBusyId === row.id
                    ? "רגע…"
                    : row.isPro
                      ? "סגירת פרו"
                      : "פתיחת פרו"}
                </button>
              )}
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
  const [activeOnly, setActiveOnly] = useState(
    () => localStorage.getItem(SUBS_FILTER_KEY) === "1"
  );
  function toggleActiveOnly(on) {
    setActiveOnly(on);
    try {
      localStorage.setItem(SUBS_FILTER_KEY, on ? "1" : "0");
    } catch {
      // אם localStorage חסום — עדיין עובד לפגישה הנוכחית
    }
  }
  const onlyActive = (rows) =>
    activeOnly
      ? (rows || []).filter((r) => ACTIVE_STATUSES.includes(r.status))
      : rows || [];
  const [selected, setSelected] = useState(() => new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  /* איזה גן נמצא כרגע בתהליך שינוי — כדי לנטרל את הכפתור שלו בלבד. */
  const [proBusyId, setProBusyId] = useState(null);

  /*
    פתיחה/סגירה של פרו לגן. סגירה נשאלת לאישור ופתיחה לא: פתיחה בטעות היא
    אי-נוחות שמתקנים בלחיצה, וסגירה בטעות מורידה פיצ'רים ללקוחה משלמת.
  */
  async function handleSetPro(row) {
    if (row.isPro && !window.confirm(`לסגור את מסלול הפרו של "${row.name}"?`)) {
      return;
    }
    setProBusyId(row.id);
    setMsg(null);
    try {
      const result = await setCommitteePro(row.id, !row.isPro);
      setMsg({ ok: true, text: result?.message || "בוצע" });
      reload();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setProBusyId(null);
    }
  }

  const suppliers =
    data && Array.isArray(data.suppliers) ? data.suppliers : [];
  const committees =
    data && Array.isArray(data.committees) ? data.committees : [];
  // נרשמו ולא השלימו הקמה (אין להם ועד) — לפנייה במייל או ניקוי חשבונות-בדיקה
  const incomplete =
    data && Array.isArray(data.incompleteSignups) ? data.incompleteSignups : [];

  // בחירת גנים למחיקה (ניקוי גני-בדיקה) — מנגנון נפרד מהספקים
  const [selectedC, setSelectedC] = useState(() => new Set());
  const [bulkConfirmC, setBulkConfirmC] = useState(false);
  const [bulkBusyC, setBulkBusyC] = useState(false);

  function toggleSelectedCommittee(id) {
    setSelectedC((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMsg(null);
  }

  async function handleCommitteeBulkDelete() {
    const ids = committees.filter((c) => selectedC.has(c.id)).map((c) => c.id);
    setBulkBusyC(true);
    setMsg(null);
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        await deleteCommittee(id);
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    setBulkConfirmC(false);
    setSelectedC(new Set());
    await reload();
    setBulkBusyC(false);
    setMsg(
      fail === 0
        ? { ok: true, text: `נמחקו ${ok} גנים. הרשימה עודכנה.` }
        : {
            ok: false,
            text: `נמחקו ${ok}, ${fail} לא נמחקו (ייתכן חשבון מנהלת או חשבון עם כמה גנים).`,
          }
    );
  }

  function toggleSelected(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMsg(null);
  }

  // בחירת "נרשמו שלא השלימו" למחיקה (ניקוי חשבונות-בדיקה)
  const [selectedI, setSelectedI] = useState(() => new Set());
  const [bulkConfirmI, setBulkConfirmI] = useState(false);
  const [bulkBusyI, setBulkBusyI] = useState(false);

  function toggleSelectedIncomplete(id) {
    setSelectedI((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMsg(null);
  }

  async function handleIncompleteBulkDelete() {
    const ids = incomplete.filter((u) => selectedI.has(u.id)).map((u) => u.id);
    setBulkBusyI(true);
    setMsg(null);
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        await deleteIncompleteUser(id);
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    setBulkConfirmI(false);
    setSelectedI(new Set());
    await reload();
    setBulkBusyI(false);
    setMsg(
      fail === 0
        ? { ok: true, text: `נמחקו ${ok} נרשמים. הרשימה עודכנה.` }
        : { ok: false, text: `נמחקו ${ok}, ${fail} לא נמחקו.` }
    );
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
            <strong>{data.committees ? data.committees.length : 0}</strong> ועדים
            רשומים {" · "}
            <strong>{data.suppliers ? data.suppliers.length : 0}</strong> ספקים
            רשומים
          </p>
          <p className="subs__summary">
            <strong>{data.activeCount}</strong> מנויים בתשלום
            {data.trialCount > 0 && (
              <>
                {" · "}
                {/* המבצע נספר בנפרד: אחרת "מספר המנויים" היה קופץ בזמן
                    המבצע ומתרסק ב-1.10 בלי ששום דבר באמת קרה. */}
                <strong>{data.trialCount}</strong> בפרו ללא עלות
              </>
            )}
            {data.expiringSoonCount > 0 && (
              <>
                {" · "}
                <span className="subs__warn">
                  {data.expiringSoonCount} פגים בתוך 30 יום
                </span>
              </>
            )}
          </p>

          <label className="subs__filter">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => toggleActiveOnly(e.target.checked)}
            />
            הצג רק פעילים (הסתר פג / לא מנוי)
          </label>

          <SubscriptionList
            title="ועדי הורים"
            icon="users"
            rows={onlyActive(data.committees)}
            selected={selectedC}
            onToggle={toggleSelectedCommittee}
            onSetPro={handleSetPro}
            proBusyId={proBusyId}
          />
          {/* מחיקת גני-בדיקה — בטוח (רק גן יחיד של חשבון רגיל; חשבון מנהלת מוגן) */}
          {selectedC.size > 0 && (
            <div className="subs__bulk">
              {bulkConfirmC ? (
                <>
                  <span className="subs__confirm-q">
                    למחוק לצמיתות {selectedC.size} גנים? כל הנתונים שלהם (תלמידים,
                    תשלומים, הוצאות) יימחקו — אי אפשר לשחזר.
                    <br />
                    <small>
                      {committees
                        .filter((c) => selectedC.has(c.id))
                        .map((c) => c.name)
                        .join(", ")}
                    </small>
                  </span>
                  <Button
                    variant="danger"
                    isLoading={bulkBusyC}
                    onClick={handleCommitteeBulkDelete}
                  >
                    כן, מחק {selectedC.size}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setBulkConfirmC(false)}
                  >
                    ביטול
                  </Button>
                </>
              ) : (
                <Button
                  variant="danger"
                  onClick={() => {
                    setBulkConfirmC(true);
                    setMsg(null);
                  }}
                >
                  <Icon name="trash" size={15} /> מחיקת הגנים הנבחרים (
                  {selectedC.size})
                </Button>
              )}
            </div>
          )}
          <SubscriptionList
            title="ספקים"
            icon="tag"
            rows={onlyActive(data.suppliers)}
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
          {/* נרשמו ולא השלימו הקמה — רשימת מעקב נפרדת (לא מושפעת ממסנן
              "רק פעילים"): לפנייה במייל, או לניקוי חשבונות-בדיקה שמנפחים את
              מספר "הנרשמים". */}
          {incomplete.length > 0 && (
            <>
              <SubscriptionList
                title="נרשמו ולא השלימו הקמה"
                icon="bell"
                rows={incomplete}
                selected={selectedI}
                onToggle={toggleSelectedIncomplete}
              />
              <p className="subs__hint">
                נרשמו אך לא הקימו ועד. אפשר לפנות אליהם במייל (לחיצה על הכתובת)
                ולבדוק אם צריכים עזרה — או לסמן ולמחוק חשבונות-בדיקה, וכך מספר
                הנרשמים יתעדכן למספר האמיתי.
              </p>
              {selectedI.size > 0 && (
                <div className="subs__bulk">
                  {bulkConfirmI ? (
                    <>
                      <span className="subs__confirm-q">
                        למחוק לצמיתות {selectedI.size} נרשמים? (חשבונות ללא ועד —
                        אין להם נתונים נוספים.)
                      </span>
                      <Button
                        variant="danger"
                        isLoading={bulkBusyI}
                        onClick={handleIncompleteBulkDelete}
                      >
                        כן, מחק {selectedI.size}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setBulkConfirmI(false)}
                      >
                        ביטול
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="danger"
                      onClick={() => {
                        setBulkConfirmI(true);
                        setMsg(null);
                      }}
                    >
                      <Icon name="trash" size={15} /> מחיקת הנבחרים (
                      {selectedI.size})
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

export default SubscriptionsCard;
