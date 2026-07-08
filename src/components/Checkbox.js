/*
  Checkbox — תיבת סימון גנרית עם תווית (נגישות: התווית לחיצה גם היא).
*/
function Checkbox({ id, label, checked, onChange }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{ width: "20px", height: "20px", accentColor: "var(--color-primary)" }}
        />
        {label}
      </label>
    </div>
  );
}

export default Checkbox;
