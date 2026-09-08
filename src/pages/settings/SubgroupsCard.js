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
  התלמידים משויכים לקבוצות האלה (ברשימת התלמידים). לא משנה תשלומים/חוב.
*/
function SubgroupsCard() {
  const [groupId, setGroupId] = useState(null);
  const [names, setNames] = useState([]);
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
          setNames(Array.isArray(active.subgroups) ? active.subgroups : []);
        }
      })
      .catch(() => {});
  }, []);

  function touched(next) {
    setNames(next);
    setSaved(false);
    setError("");
  }
  const addGroup = () => touched([...names, ""]);
  const updateGroup = (i, value) =>
    touched(names.map((n, idx) => (idx === i ? value : n)));
  const removeGroup = (i) => touched(names.filter((_, idx) => idx !== i));

  async function handleSave() {
    const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
    setIsSaving(true);
    setSaved(false);
    setError("");
    try {
      const group = await updateSubgroups(groupId, unique);
      const savedList = Array.isArray(group.subgroups) ? group.subgroups : unique;
      setNames(savedList);
      // מעדכנים את המטמון כדי שהמסכים האחרים (טופס/סינון) יראו את הקבוצות מיד
      patchOnboarding({
        groups: savedList,
        subgroups: savedList,
        hasGroups: savedList.length > 0,
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
        אחר כך משייכים כל תלמיד לקבוצה ברשימת התלמידים.
      </p>
      {names.length === 0 && (
        <p className="settings__hint">עדיין אין קבוצות — אפשר להוסיף למטה.</p>
      )}
      {names.map((name, i) => (
        <div
          key={i}
          style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 8 }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Input
              id={`settings-subgroup-${i}`}
              label={`קבוצה ${i + 1}`}
              value={name}
              onChange={(e) => updateGroup(i, e.target.value)}
              placeholder="למשל: צהרון"
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
