/*
  FilterChips — שורת "צ'יפים" גנרית לסינון רשימה לפי ערך יחיד (קטגוריה, עיר...).
  מציג כפתור "הכל" ואחריו כפתור לכל אפשרות; הנבחר מסומן. הרכיב לא מכיר את
  התוכן שהוא מסנן — מקבל אפשרויות, ערך נבחר ופונקציית שינוי, ולכן משמש כל מסך.

  baseClass מאפשר להשתמש בעיצוב שכבר קיים במסך (למשל "vendors__filter"),
  כדי לא לשכפל CSS. המחלקה הפעילה היא <baseClass>--active, והעטיפה <baseClass>s.
*/
function FilterChips({
  options,
  value,
  onChange,
  label,
  allLabel = "הכל",
  baseClass = "vendors__filter",
}) {
  if (!options || options.length === 0) {
    return null;
  }

  const chipClass = (isActive) =>
    `${baseClass}${isActive ? ` ${baseClass}--active` : ""}`;

  return (
    <div className={`${baseClass}s`} role="group" aria-label={label}>
      {label && <span className={`${baseClass}-label`}>{label}:</span>}
      <button
        type="button"
        className={chipClass(!value)}
        aria-pressed={!value}
        onClick={() => onChange("")}
      >
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={chipClass(value === option)}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default FilterChips;
