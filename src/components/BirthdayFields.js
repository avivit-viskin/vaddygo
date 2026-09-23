import Select from "./Select";

/*
  BirthdayFields — יום וחודש בלבד, בלי שנת לידה.

  🔒 בדיקת הפרטיות (23.09.2026): השימוש היחיד בתאריך הלידה של ילד הוא ברכת
  יום הולדת, ולשם כך השנה מיותרת — והיא בדיוק הנתון שהופך "14 במרץ" לנתון
  מזהה. לכן לא מבקשים אותה בכלל, ולא רק "לא שומרים" אותה: שדה תאריך רגיל
  מכריח את ההורה להקליד שנה שהמערכת זורקת, וזו איסוף מיותר.

  הערך נשמר ועובר בפורמט ISO (‎YYYY-MM-DD) עם שנת-דמה קבועה, כדי שכל מה
  שנשען על השדה — השרת, הייבוא והתצוגה — ימשיך לעבוד בלי שינוי.
*/
export const PLACEHOLDER_YEAR = 2000;

const MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

/* כמה ימים יש בחודש — פברואר 29, כדי שלא לחסום ילד שנולד ב-29.2. */
export function daysInMonth(month) {
  if (!month) return 31;
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31;
}

/* "2000-03-14" → { day: 14, month: 3 }. ערך ריק/שגוי → ריק. */
export function splitBirthday(value) {
  const parts = String(value || "").slice(0, 10).split("-");
  if (parts.length !== 3) return { day: "", month: "" };
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!month || !day) return { day: "", month: "" };
  return { day, month };
}

/* { day, month } → "2000-03-14". חסר אחד מהם → ריק (אין חצי תאריך). */
export function joinBirthday(day, month) {
  if (!day || !month) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${PLACEHOLDER_YEAR}-${pad(month)}-${pad(day)}`;
}

function BirthdayFields({ value, onChange }) {
  const { day, month } = splitBirthday(value);

  function change(nextDay, nextMonth) {
    onChange(joinBirthday(nextDay, nextMonth));
  }

  return (
    <div className="birthday-fields">
      <Select
        id="student-birth-day"
        name="birthDay"
        label="יום הולדת — יום (לא חובה)"
        value={day ? String(day) : ""}
        onChange={(e) => change(Number(e.target.value), month)}
      >
        <option value="">—</option>
        {Array.from({ length: daysInMonth(month) }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </Select>
      <Select
        id="student-birth-month"
        name="birthMonth"
        label="חודש (לא חובה)"
        value={month ? String(month) : ""}
        onChange={(e) => change(day, Number(e.target.value))}
      >
        <option value="">—</option>
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </Select>
    </div>
  );
}

export default BirthdayFields;
