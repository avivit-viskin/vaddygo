import Input from "../../components/Input";

/*
  GanDetailsStep — צעד 1 באשף: פרטי הגן/בית הספר (UI_SPEC סעיף 3).
  העיר בהקלדה חופשית בינתיים — רשימת יישובים תחובר כשבעלת המוצר תאשר מקור נתונים.
*/
function GanDetailsStep({ data, errors, onChange }) {
  return (
    <>
      <p className="wizard__question">ברוכים הבאים! כמה פרטים ומזנקים...</p>
      <Input
        id="ob-city"
        label="עיר / יישוב"
        value={data.city}
        onChange={(e) => onChange({ city: e.target.value })}
        error={errors.city}
      />
      <Input
        id="ob-name"
        label="שם הגן / בית הספר"
        placeholder="למשל: גן הפרחים"
        value={data.ganName}
        onChange={(e) => onChange({ ganName: e.target.value })}
        error={errors.ganName}
      />
      <Input
        id="ob-children"
        label="מספר ילדים"
        type="number"
        min="1"
        value={data.childrenCount}
        onChange={(e) => onChange({ childrenCount: e.target.value })}
        error={errors.childrenCount}
      />
      <Input
        id="ob-staff"
        label="מספר אנשי צוות"
        type="number"
        min="0"
        value={data.staffCount}
        onChange={(e) => onChange({ staffCount: e.target.value })}
        error={errors.staffCount}
      />
    </>
  );
}

export default GanDetailsStep;
