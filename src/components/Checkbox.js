/*
  Checkbox — תיבת סימון גנרית עם תווית (נגישות: התווית לחיצה גם היא).
*/
function Checkbox({ id, label, checked, onChange }) {
  return (
    <div className="field">
      {/* marginBottom:0 מבטל את ה-6px של .field__label (שנועד לתווית *מעל* שדה):
          בצ'קבוקס התיבה נמצאת *בתוך* התווית, וה-6px דחפו אותה כלפי מעלה — מה
          שהוציא אותה "לא בשורה" מול שאר הפקדים בסרגל (align-items:end). */}
      <label
        className="field__label"
        htmlFor={id}
        style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: 0 }}
      >
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
