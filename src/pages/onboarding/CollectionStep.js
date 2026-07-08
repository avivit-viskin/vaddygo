import Input from "../../components/Input";

/*
  CollectionStep — צעד 4 באשף: "כמה גובים השנה?" (UI_SPEC סעיף 5).
  הקטגוריות והסכומים לדוגמה — מהאפיון של בעלת המוצר.
  יעד הגבייה מחושב אוטומטית: סה"כ לתלמיד × מספר הילדים
  (ממתין לאישור בקובץ השאלות, שאלה 5).
*/
const INSTALLMENT_OPTIONS = [1, 2, 3];

function CollectionStep({ data, onChange }) {
  function updateCategory(key, patch) {
    const categories = data.categories.map((c) =>
      c.key === key ? { ...c, ...patch } : c
    );
    onChange({ categories });
  }

  const totalPerChild = data.categories.reduce(
    (sum, c) => sum + (Number(c.amount) || 0),
    0
  );
  const childrenCount = Number(data.childrenCount) || 0;
  const totalGoal = totalPerChild * childrenCount;

  return (
    <>
      <p className="wizard__question">כמה גובים השנה?</p>
      <p className="auth-page__hint" style={{ textAlign: "right", margin: "0 0 8px" }}>
        הסכומים יעזרו לעקוב ולהמליץ על חלוקת התקציב.
      </p>

      {data.categories.map((cat) => (
        <div className="category-row" key={cat.key}>
          <div className="category-row__name">{cat.name}</div>
          <Input
            id={`ob-amount-${cat.key}`}
            label="סכום לתלמיד לשנה (₪)"
            type="number"
            min="0"
            placeholder={cat.examplePlaceholder}
            value={cat.amount}
            onChange={(e) => updateCategory(cat.key, { amount: e.target.value })}
          />
          <div className="category-row__installments">
            <span>חלוקה לתשלומים:</span>
            <div className="chips">
              {INSTALLMENT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`chip${cat.installments === n ? " chip--active" : ""}`}
                  aria-pressed={cat.installments === n}
                  onClick={() => updateCategory(cat.key, { installments: n })}
                >
                  {n === 1 ? "תשלום אחד" : `${n} תשלומים`}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="totals">
        <div>סה"כ לתלמיד: {totalPerChild.toLocaleString("he-IL")} ₪</div>
        <div>
          יעד גבייה כולל ל-{childrenCount.toLocaleString("he-IL")} תלמידים:{" "}
          {totalGoal.toLocaleString("he-IL")} ₪
        </div>
      </div>
    </>
  );
}

export default CollectionStep;
