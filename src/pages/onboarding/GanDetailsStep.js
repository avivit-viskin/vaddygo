import { useEffect, useState } from "react";
import Input from "../../components/Input";
import Autocomplete from "../../components/Autocomplete";
import { ISRAELI_CITIES } from "../../data/israeliCities";
import { searchKindergartens } from "../../services/kindergartensService";

/*
  GanDetailsStep — צעד 1 באשף: פרטי הגן/בית הספר (UI_SPEC סעיף 3).
  העיר עם השלמה אוטומטית מרשימת היישובים. שם הגן עם השלמה אוטומטית
  מהמאגר הרשמי של משרד החינוך (לפי העיר שנבחרה) — ובכל מקרה הקלדה חופשית.
*/
function GanDetailsStep({ data, errors, onChange }) {
  const [ganOptions, setGanOptions] = useState([]);

  // הצעות שמות גנים מהמאגר הרשמי, לפי העיר והשם שהוקלד — עם debounce קטן
  // כדי לא לפנות למאגר בכל הקשה. כשל בשליפה נבלע (הקלדה חופשית תמיד עובדת).
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const results = await searchKindergartens(data.city, data.ganName, {
        limit: 10,
      });
      if (!cancelled) {
        setGanOptions(results);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [data.city, data.ganName]);

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
      <Autocomplete
        id="ob-name"
        label="שם הגן / בית הספר"
        placeholder={
          data.city ? "התחילי להקליד — נציע מהמאגר הרשמי" : "למשל: גן הפרחים"
        }
        options={ganOptions}
        filterLocally={false}
        value={data.ganName}
        onChange={(ganName) => onChange({ ganName })}
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
