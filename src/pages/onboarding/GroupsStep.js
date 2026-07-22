import { useState } from "react";

/*
  GroupsStep — צעד 2 באשף: חלוקה לקבוצות (UI_SPEC סעיף 4).
  בבית ספר יש כיתות קבועות א'–ו' ואופציית "אחר" — למי שמנהל ועד גם מעל כיתה ו'
  (חטיבה/תיכון) אפשר להקליד ידנית שם כיתה נוסף.
*/
const GAN_GROUPS = ["תינוקייה", "פעוטות", "בוגרים", "חובה"];
const SCHOOL_GROUPS = ["א", "ב", "ג", "ד", "ה", "ו"];

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      className={`chip${active ? " chip--active" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function GroupsStep({ data, onChange }) {
  const isSchool = data.institutionType === "school";
  const predefined = isSchool ? SCHOOL_GROUPS : GAN_GROUPS;
  // כיתות שהוקלדו ידנית ("אחר") — כל מה שנבחר ואינו ברשימה הקבועה
  const customGroups = data.groups.filter((g) => !predefined.includes(g));

  // מציגים את שדה "אחר" אם כבר יש כיתה מותאמת אישית, או שהמשתמשת פתחה אותו
  const [showOther, setShowOther] = useState(customGroups.length > 0);
  const [customName, setCustomName] = useState("");

  function toggleGroup(name) {
    const groups = data.groups.includes(name)
      ? data.groups.filter((g) => g !== name)
      : [...data.groups, name];
    onChange({ groups });
  }

  function addCustom() {
    const name = customName.trim();
    if (!name || data.groups.includes(name)) {
      setCustomName("");
      return;
    }
    onChange({ groups: [...data.groups, name] });
    setCustomName("");
  }

  function handleCustomKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addCustom();
    }
  }

  return (
    <>
      <p className="wizard__question">האם יש חלוקה לקבוצות בתוך הגן?</p>
      <div className="chips">
        <Chip
          label="כן"
          active={data.hasGroups === true}
          onClick={() => onChange({ hasGroups: true })}
        />
        <Chip
          label="לא"
          active={data.hasGroups === false}
          onClick={() => onChange({ hasGroups: false, groups: [] })}
        />
      </div>

      {data.hasGroups && (
        <>
          <p className="wizard__question">איפה אנחנו?</p>
          <div className="chips">
            <Chip
              label="גן"
              active={data.institutionType === "gan"}
              onClick={() => onChange({ institutionType: "gan", groups: [] })}
            />
            <Chip
              label="בית ספר"
              active={data.institutionType === "school"}
              onClick={() => onChange({ institutionType: "school", groups: [] })}
            />
          </div>

          <p className="wizard__question">
            {isSchool ? "סמנו את הכיתות:" : "סמנו את הקבוצות הקיימות:"}
          </p>
          <div className="chips">
            {predefined.map((name) => (
              <Chip
                key={name}
                label={name}
                active={data.groups.includes(name)}
                onClick={() => toggleGroup(name)}
              />
            ))}
            {/* כיתות שהוקלדו ידנית — מוצגות כצ'יפים שאפשר להסיר בלחיצה */}
            {customGroups.map((name) => (
              <Chip
                key={name}
                label={name}
                active
                onClick={() => toggleGroup(name)}
              />
            ))}
            {isSchool && (
              <Chip
                label="אחר"
                active={showOther}
                onClick={() => setShowOther((v) => !v)}
              />
            )}
          </div>

          {isSchool && showOther && (
            <div className="groups-other">
              <input
                className="field__input"
                type="text"
                placeholder="שם הכיתה (למשל: ז', מכינה)"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                onKeyDown={handleCustomKeyDown}
                aria-label="הוספת כיתה ידנית"
              />
              <button type="button" className="chip" onClick={addCustom}>
                הוספה
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default GroupsStep;
