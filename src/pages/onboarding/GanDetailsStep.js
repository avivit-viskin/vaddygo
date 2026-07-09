import Input from "../../components/Input";
import Autocomplete from "../../components/Autocomplete";
import { ISRAELI_CITIES } from "../../data/israeliCities";

/*
  GanDetailsStep — צעד 1 באשף: פרטי הגן/בית הספר (UI_SPEC סעיף 3).
  העיר עם השלמה אוטומטית מרשימת היישובים, ועם אפשרות להקלדה חופשית
  ליישוב שאינו ברשימה.
*/
function GanDetailsStep({ data, errors, onChange }) {
  return (
    <>
      <p className="wizard__question">ברוכים הבאים! כמה פרטים ומזנקים...</p>
      <Autocomplete
        id="ob-city"
        label="עיר / יישוב"
        placeholder="התחילי להקליד עיר..."
        options={ISRAELI_CITIES}
        value={data.city}
        onChange={(city) => onChange({ city })}
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
