import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Icon from "../../components/Icon";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { getGroups, updateSubgroups } from "../../services/groupsService";
import { getActiveServerGroupId } from "../../services/institutionsService";
import { patchOnboarding } from "../../services/onboardingService";

/*
  SubgroupsCard — עריכת החלוקה לקבוצות של המוסד ממסך ההגדרות (פרטי המוסד).
  מי שלא חילק בהקמה — יכול להוסיף כאן; אפשר לכתוב כל שם חופשי (למשל "צהרון").
  לכל קבוצה אפשר גם לקבוע סכום גבייה משלה (כי מכל קבוצה גובים אחרת) — ריק =
  סכום הקטגוריות הרגיל. השרת מחשב לפי זה את היעד/החוב (מסתנכרן עם היתרה).
*/

/* המרת { name, amount } מהשרת (subgroups + subgroupAmounts) לשורות העריכה */
function toRows(group) {
  const names = Array.isArray(group?.subgroups) ? group.subgroups : [];
  const amounts = group?.subgroupAmounts || {};
  return names.map((name) => ({
    name,
    amount:
      amounts[name] != null && Number(amounts[name]) > 0
        ? String(amounts[name])
        : "",
  }));
}

function SubgroupsCard() {
  const [groupId, setGroupId] = useState(null);
  const [rows, setRows] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getGroups()
      .then((groups) => {
        const activeId = getActiveServerGroupId();
        const active =
          (groups || []).find((g) => g.id === activeId) ?? (groups || [])[0];
        if (active) {
          setGroupId(active.id);
          setRows(toRows(active));
        }
      })
      .catch(() => {});
  }, []);

  function touched(next) {
    setRows(next);
    setSaved(false);
    setError("");
  }
  const addGroup = () => touched([...rows, { name: "", amount: "" }]);
  const updateField = (i, field, value) =>
    touched(rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  const removeGroup = (i) => touched(rows.filter((_, idx) => idx !== i));

  async function handleSave() {
    // מסננים שורות ריקות ומאחדים שמות כפולים (הראשון מנצח על הסכום)
    const seen = new Set();
    const clean = [];
    for (const r of rows) {
      const name = (r.name || "").trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      clean.push({ name, amount: r.amount });
    }
    setIsSaving(true);
    setSaved(false);
    setError("");
    try {
      const group = await updateSubgroups(groupId, clean);
      const savedRows = toRows(group);
      setRows(savedRows);
      const savedNames = savedRows.map((r) => r.name);
      // מעדכנים את המטמון כדי שהמסכים האחרים (טופס/סינון) יראו את הקבוצות מיד
      patchOnboarding({
        groups: savedNames,
        subgroups: savedNames,
        hasGroups: savedNames.length > 0,
      });
      setSaved(true);
    } catch (err) {
      setError(err.message || "השמירה נכשלה, אפשר לנסות שוב");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card
      title={
        <>
          <Icon name="users" size={20} /> חלוקה לקבוצות
        </>
      }
    >
      <p className="settings__hint">
        חלוקת המוסד לקבוצות (למשל: תינוקייה / פעוטות / צהרון). אפשר לכתוב כל שם.
        אפשר גם לקבוע לכל קבוצה כמה גובים ממנה — אם משאירים ריק, גובים את סכום
        הקטגוריות הרגיל. אחר כך משייכים כל תלמיד לקבוצה ברשימת התלמידים.
      </p>
      {rows.length === 0 && (
        <p className="settings__hint">עדיין אין קבוצות — אפשר להוסיף למטה.</p>
      )}
      {rows.map((row, i) => (
        <div
          key={i}
          style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 8 }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Input
              id={`settings-subgroup-${i}`}
              label={`קבוצה ${i + 1}`}
              value={row.name}
              onChange={(e) => updateField(i, "name", e.target.value)}
              placeholder="למשל: צהרון"
            />
          </div>
          <div style={{ width: 120, flexShrink: 0 }}>
            <Input
              id={`settings-subgroup-amount-${i}`}
              label="כמה נגבה (₪)"
              type="number"
              min="0"
              value={row.amount}
              onChange={(e) => updateField(i, "amount", e.target.value)}
              placeholder="רגיל"
            />
          </div>
          <button
            type="button"
            onClick={() => removeGroup(i)}
            aria-label="הסרת הקבוצה"
            style={{
              flexShrink: 0,
              width: 42,
              height: 42,
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              background: "none",
              color: "var(--color-error)",
              cursor: "pointer",
              marginBottom: 2,
            }}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      ))}
      <Button variant="secondary" onClick={addGroup}>
        + הוספת קבוצה
      </Button>
      {!groupId && (
        <p className="settings__hint">
          כדי לשמור בשרת צריך גן מסונכרן. אם נרשמת עכשיו — כדאי לרענן ולנסות שוב.
        </p>
      )}
      <div className="settings__save-row" style={{ marginTop: 14 }}>
        <Button onClick={handleSave} isLoading={isSaving} disabled={!groupId}>
          שמירת הקבוצות
        </Button>
        {saved && <span className="settings__saved">נשמר! ✅</span>}
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}

export default SubgroupsCard;
