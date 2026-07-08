/*
  GroupsStep — צעד 2 באשף: חלוקה לקבוצות (UI_SPEC סעיף 4).
  רשימות הקבוצות מהאפיון של בעלת המוצר; קבוצות גן נוספות ממתינות
  לתשובתה בקובץ השאלות (שאלה 2) — לא ממציאים.
*/
const GAN_GROUPS = ["תינוקייה", "פעוטות", "בוגרים", "חובה"];
const SCHOOL_GROUPS = ["א", "ב", "ג", "ד", "ה", "ו", "אחר"];

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
  const options = data.institutionType === "school" ? SCHOOL_GROUPS : GAN_GROUPS;

  function toggleGroup(name) {
    const groups = data.groups.includes(name)
      ? data.groups.filter((g) => g !== name)
      : [...data.groups, name];
    onChange({ groups });
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
            {data.institutionType === "school"
              ? "סמני את הכיתות:"
              : "סמני את הקבוצות הקיימות:"}
          </p>
          <div className="chips">
            {options.map((name) => (
              <Chip
                key={name}
                label={name}
                active={data.groups.includes(name)}
                onClick={() => toggleGroup(name)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default GroupsStep;
