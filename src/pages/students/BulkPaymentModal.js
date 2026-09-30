import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Spinner from "../../components/Spinner";
import ErrorMessage from "../../components/ErrorMessage";
import {
  getStudentPayments,
  saveStudentPayment,
} from "../../services/paymentsService";
import { formatShekels } from "../../services/format";

/*
  BulkPaymentModal — סימון תשלום לכל התלמידים שנבחרו, בבת אחת.

  הרקע: אחרי גבייה במזומן בערב הורים או העברה מרוכזת, הוועד צריך לסמן עשרות
  ילדים אחד-אחד. הסימון המרובה כבר קיים למחיקה ולהעברה לקבוצה — זו אותה
  פעולה, על הכסף.

  ארבע החלטות:

  1. **הקטגוריות נקראות מהתלמידים עצמם, לפי שם.** לילד בקבוצה יש שורת תשלום
     נוספת ("תוספת קבוצה — צהרון") שאין לילד אחר, ומזהה הקטגוריה שונה בין
     גנים. לכן בוחרים **שם** קטגוריה, וכל ילד משולם בשורה שלו.

  2. **מי שאין לו את הקטגוריה — מדולג ונספר.** אם סימנת את כל הגן וביקשת את
     תוספת הצהרון, רק ילדי הצהרון ישולמו. זה לא כישלון, וזה חייב להיאמר.

  3. **הסכום מוצע ולא נכפה.** ברירת המחדל היא סכום הקטגוריה, אבל אפשר לשנות
     (גבייה חלקית). סכום 0 חוסם — סימון "שולם 0" הוא כמעט תמיד טעות.

  4. **מה שנכשל מדווח בשמו.** תשלום הוא כסף: "8 סומנו, 2 נכשלו" בלי לדעת מי,
     גרוע יותר מלא לעשות כלום.
*/
const METHODS = [
  { key: "cashAmount", label: "מזומן" },
  { key: "bitAmount", label: "ביט" },
  { key: "payBoxAmount", label: "פייבוקס" },
  { key: "cardAmount", label: "אשראי" },
];

/* שורות התשלום של כל הנבחרים, לפי מזהה תלמיד. */
async function loadRows(studentIds) {
  const entries = await Promise.all(
    studentIds.map(async (id) => [id, await getStudentPayments(id)])
  );
  return new Map(entries);
}

/* איחוד שמות הקטגוריות שקיימות אצל הנבחרים, עם הסכום שלהן. */
export function categoryOptions(rowsById) {
  const byName = new Map();
  for (const rows of rowsById.values()) {
    for (const row of rows || []) {
      if (!byName.has(row.categoryName)) {
        byName.set(row.categoryName, {
          name: row.categoryName,
          amount: Number(row.amount) || 0,
          count: 0,
        });
      }
      byName.get(row.categoryName).count += 1;
    }
  }
  return [...byName.values()];
}

function BulkPaymentModal({ isOpen, studentIds, students, onClose }) {
  /*
    🔴 צילום־מצב של הנבחרים **בפתיחה**, והרענון נדחה לסגירה.

    שתי סיבות, ושתיהן התגלו רק בהרצה במסך האמיתי: ניקוי הבחירה אחרי הרישום
    רוקן את החלון תוך כדי ("0 תלמידים"), ורענון הרשימה החזיר את מסך התלמידים
    למצב טעינה — מה ש**מפרק את החלון כולו** ומוחק את הודעת האישור לפני
    שהספיקו לקרוא אותה. לכן: החלון עובד על הרשימה שלו, ומי שסוגר אותו הוא
    שמרענן.
  */
  const [ids, setIds] = useState([]);
  const [rowsById, setRowsById] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cashAmount");
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    let cancelled = false;
    const snapshot = studentIds;
    setIds(snapshot);
    setRowsById(null);
    setLoadError("");
    setResult(null);
    setSaveError("");
    loadRows(snapshot)
      .then((map) => {
        if (cancelled) return;
        setRowsById(map);
        const options = categoryOptions(map);
        const first = options[0];
        setCategoryName(first ? first.name : "");
        setAmount(first ? String(first.amount) : "");
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "לא הצלחנו לטעון את הקטגוריות");
      });
    return () => {
      cancelled = true;
    };
    // במתכוון רק על isOpen: שינוי הבחירה בזמן שהחלון פתוח לא אמור לאפס אותו.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const options = rowsById ? categoryOptions(rowsById) : [];
  const chosen = options.find((o) => o.name === categoryName);
  /* כמה מהנבחרים באמת יקבלו את התשלום — השאר אינם בקבוצה של הקטגוריה. */
  const applicable = chosen ? chosen.count : 0;
  const skipped = ids.length - applicable;

  function pickCategory(name) {
    setCategoryName(name);
    const option = options.find((o) => o.name === name);
    setAmount(option ? String(option.amount) : "");
  }

  async function apply() {
    const value = Number(amount);
    if (!(value > 0)) {
      setSaveError("צריך להזין סכום גדול מאפס");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    const done = [];
    const failed = [];
    for (const id of ids) {
      const row = (rowsById.get(id) || []).find((r) => r.categoryName === categoryName);
      if (!row) continue; // אין לו את הקטגוריה — מדולג בשקט, נספר למעלה
      const payment = {
        isPaid: true,
        bitAmount: 0,
        payBoxAmount: 0,
        cashAmount: 0,
        cardAmount: 0,
        [method]: value,
      };
      try {
        await saveStudentPayment(id, row.collectionCategoryId, payment);
        done.push(id);
      } catch (err) {
        const s = (students || []).find((x) => x.id === id);
        failed.push(s ? `${s.firstName} ${s.lastName}` : `#${id}`);
      }
    }
    setIsSaving(false);
    setResult({ done: done.length, failed });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`סימון תשלום ל-${ids.length} תלמידים`}
    >
      {loadError && <ErrorMessage message={loadError} />}

      {!rowsById && !loadError && <Spinner text="טוען את הקטגוריות..." />}

      {rowsById && !result && (
        <>
          <p className="bulk-payment__intro">
            בוחרים קטגוריה וסכום — והתשלום נרשם לכל מי שסומן/ה.
          </p>

          <Select
            id="bulk-payment-category"
            label="קטגוריה"
            value={categoryName}
            onChange={(e) => pickCategory(e.target.value)}
          >
            {options.map((o) => (
              <option key={o.name} value={o.name}>
                {o.name} ({formatShekels(o.amount)})
              </option>
            ))}
          </Select>

          {/*
            השקיפות שמונעת טעות יקרה: כשבוחרים תוספת של קבוצה ומסומנים ילדים
            שאינם בה — אומרים את זה **לפני** הלחיצה, לא אחריה.
          */}
          {skipped > 0 && (
            <p className="bulk-payment__note" role="status">
              ל-{skipped} מהמסומנים אין את הקטגוריה הזו (הם אינם בקבוצה שלה) —
              התשלום יירשם ל-{applicable}.
            </p>
          )}

          <Input
            id="bulk-payment-amount"
            label="סכום לכל ילד"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Select
            id="bulk-payment-method"
            label="אמצעי תשלום"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            {METHODS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </Select>

          <p className="bulk-payment__total">
            סך הכל ייקלט:{" "}
            <strong>{formatShekels((Number(amount) || 0) * applicable)}</strong>{" "}
            ({applicable} תלמידים)
          </p>

          {saveError && <ErrorMessage message={saveError} />}

          <div className="bulk-payment__actions">
            <Button onClick={apply} isLoading={isSaving} disabled={applicable === 0}>
              רישום התשלום
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              ביטול
            </Button>
          </div>
        </>
      )}

      {result && (
        <div className="bulk-payment__result" role="status">
          <p>✅ התשלום נרשם ל-{result.done} תלמידים.</p>
          {skipped > 0 && (
            <p>⏭️ {skipped} דולגו — אין להם את הקטגוריה הזו.</p>
          )}
          {result.failed.length > 0 && (
            <p className="bulk-payment__failed">
              ⚠️ לא נרשם עבור: {result.failed.join(", ")}. אפשר לנסות שוב.
            </p>
          )}
          <Button onClick={onClose}>סגירה</Button>
        </div>
      )}
    </Modal>
  );
}

export default BulkPaymentModal;
