import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "../hooks/useApi";
import { getGroups, updateGroupCategories } from "../services/groupsService";
import { formatShekels } from "../services/format";
import Input from "../components/Input";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import "../styles/onboarding.css";

const INSTALLMENTS = [1, 2, 3];

/*
  קטגוריות גבייה מומלצות (המלצה כללית) — נטענות כברירת מחדל כשעדיין לא הוגדרו
  קטגוריות, כדי לתת נקודת פתיחה. כל מוסד מתאים את הסכומים לעצמו לפני השמירה.
*/
const RECOMMENDED_CATEGORIES = [
  { name: "הזנה", amount: "1200", installments: 2 },
  { name: "דמי ועד", amount: "500", installments: 1 },
  { name: "חוגים", amount: "400", installments: 1 },
  { name: "ציוד אישי", amount: "125", installments: 1 },
];

/*
  CollectionSettingsPage — עריכת קטגוריות הגבייה של הגן אחרי ההרשמה
  (עד היום אפשר היה להגדיר אותן רק פעם אחת באשף). טוענת את הגן, מאפשרת
  להוסיף/לערוך/למחוק קטגוריות עם סכומים, ושומרת לשרת דרך
  PUT /api/groups/{id}/categories.
*/
function CollectionSettingsPage() {
  const navigate = useNavigate();
  const { data: groups, isLoading, error, reload } = useApi(getGroups);

  const group = groups && groups.length > 0 ? groups[0] : null;

  const [categories, setCategories] = useState([]);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // אינדקס הקטגוריה שממתינה לאישור הסרה (null = אין דיאלוג פתוח)
  const [categoryToRemove, setCategoryToRemove] = useState(null);

  // אתחול הרשימה המקומית מהגן ברגע שנטען; אם עדיין אין קטגוריות —
  // מתחילים מהמלצה כללית שאפשר להתאים.
  useEffect(() => {
    if (group && !ready) {
      const existing = group.categories.map((c) => ({
        name: c.name,
        amount: String(c.amountPerChild),
        installments: c.installments,
      }));
      setCategories(
        existing.length > 0
          ? existing
          : RECOMMENDED_CATEGORIES.map((c) => ({ ...c }))
      );
      setReady(true);
    }
  }, [group, ready]);

  function updateCategory(index, patch) {
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
    setSaved(false);
  }

  function addCategory() {
    setCategories((prev) => [...prev, { name: "", amount: "", installments: 1 }]);
    setSaved(false);
  }

  function confirmRemoveCategory() {
    setCategories((prev) => prev.filter((_, i) => i !== categoryToRemove));
    setSaved(false);
    setCategoryToRemove(null);
  }

  const totalPerChild = categories.reduce(
    (sum, c) => sum + (Number(c.amount) || 0),
    0
  );
  const totalGoal = totalPerChild * (group?.childrenCount ?? 0);

  async function save() {
    const payload = categories
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name.trim(),
        amountPerChild: Number(c.amount) || 0,
        installments: c.installments,
      }));

    setSaveError("");
    setIsSaving(true);
    try {
      await updateGroupCategories(group.id, payload);
      setSaved(true);
      await reload();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <Spinner text="טוען את הגדרות הגבייה..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={reload} />;
  }

  if (!group) {
    return (
      <EmptyState
        icon="🏫"
        message="עדיין לא הוגדר גן — יש להשלים קודם את ההרשמה"
        action={<Button onClick={() => navigate("/onboarding")}>להגדרת הגן</Button>}
      />
    );
  }

  return (
    <div className="collection-settings">
      <div className="page-header">
        <h2>עריכת גבייה — {group.name}</h2>
      </div>
      <p
        className="auth-page__hint"
        style={{
          textAlign: "right",
          margin: "0 0 12px",
          color: "var(--color-text)",
          fontWeight: 500,
        }}
      >
        הסכומים המוצגים הם <strong>המלצה כללית</strong> — אפשר להתאים אותם
        לסכומים שגובים במוסד שלך. השינויים נשמרים ומשפיעים על מסך הבית ועל
        התשלומים של כל תלמיד.
      </p>

      {categories.map((cat, index) => (
        <div className="category-row" key={index}>
          <Input
            id={`cat-name-${index}`}
            label="שם הקטגוריה"
            placeholder="למשל: הזנה"
            value={cat.name}
            onChange={(e) => updateCategory(index, { name: e.target.value })}
          />
          <Input
            id={`cat-amount-${index}`}
            label="סכום לתלמיד לשנה (₪)"
            type="number"
            min="0"
            value={cat.amount}
            onChange={(e) => updateCategory(index, { amount: e.target.value })}
          />
          <div className="category-row__installments">
            <span>חלוקה לתשלומים:</span>
            <div className="chips">
              {INSTALLMENTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`chip${cat.installments === n ? " chip--active" : ""}`}
                  aria-pressed={cat.installments === n}
                  onClick={() => updateCategory(index, { installments: n })}
                >
                  {n === 1 ? "תשלום אחד" : `${n} תשלומים`}
                </button>
              ))}
            </div>
          </div>
          <Button variant="danger" onClick={() => setCategoryToRemove(index)}>
            הסרת קטגוריה
          </Button>
        </div>
      ))}

      <Button variant="secondary" onClick={addCategory}>
        + הוספת קטגוריה
      </Button>

      <div className="totals">
        <div>סה"כ לתלמיד: {formatShekels(totalPerChild)}</div>
        <div>
          יעד גבייה כולל ל-{group.childrenCount} תלמידים: {formatShekels(totalGoal)}
        </div>
      </div>

      {saveError && (
        <p className="field__error" role="alert">
          {saveError}
        </p>
      )}
      {saved && (
        <p className="collection-settings__saved" role="status">
          ✓ נשמר בהצלחה
        </p>
      )}

      <div className="form-actions">
        <Button onClick={save} isLoading={isSaving}>
          שמירה
        </Button>
        <Button variant="secondary" onClick={() => navigate("/")} disabled={isSaving}>
          חזרה למסך הבית
        </Button>
      </div>

      <ConfirmDialog
        isOpen={categoryToRemove !== null}
        title="הסרת קטגוריה"
        message={
          categoryToRemove !== null
            ? `להסיר את הקטגוריה "${
                categories[categoryToRemove]?.name || "ללא שם"
              }"? השינוי ייכנס לתוקף בשמירה.`
            : ""
        }
        confirmLabel="כן, להסיר"
        onConfirm={confirmRemoveCategory}
        onCancel={() => setCategoryToRemove(null)}
      />
    </div>
  );
}

export default CollectionSettingsPage;
