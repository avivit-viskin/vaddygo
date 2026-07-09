import { useMemo, useRef, useState } from "react";
import "../styles/autocomplete.css";

/*
  Autocomplete — שדה טקסט גנרי עם השלמה אוטומטית מתוך רשימה,
  שמאפשר גם הקלדה חופשית (ערך שאינו ברשימה עדיין תקף).
  משתמש בעיצוב השדה הרגיל (.field) + רשימה נפתחת.

  props:
    id, label, value, error, placeholder
    options       — מערך מחרוזות להצעות
    onChange(val) — נקרא עם ערך המחרוזת (לא event) בכל הקלדה או בחירה
    maxSuggestions — כמה הצעות להציג (ברירת מחדל 8)
    filterLocally — האם לסנן את ההצעות לפי הטקסט (ברירת מחדל true).
                    false כשההצעות כבר מסוננות במקור (למשל תוצאות משרת).
*/
function Autocomplete({
  id,
  label,
  value = "",
  error = "",
  placeholder,
  options = [],
  onChange,
  maxSuggestions = 8,
  filterLocally = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const blurTimer = useRef(null);
  const listId = `${id}-list`;

  const filtered = useMemo(() => {
    if (!filterLocally) {
      return options.slice(0, maxSuggestions);
    }
    const query = value.trim().toLowerCase();
    const matches = query
      ? options.filter((option) => option.toLowerCase().includes(query))
      : options;
    return matches.slice(0, maxSuggestions);
  }, [value, options, maxSuggestions, filterLocally]);

  // לא מציגים רשימה כשההצעה היחידה זהה למה שכבר מוקלד
  const showList =
    isOpen &&
    filtered.length > 0 &&
    !(filtered.length === 1 && filtered[0] === value);

  function select(option) {
    onChange(option);
    setIsOpen(false);
  }

  return (
    <div className="field autocomplete">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`field__input${error ? " field__input--error" : ""}`}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        aria-invalid={error ? "true" : "false"}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // עיכוב קטן כדי שלחיצה על הצעה תספיק להירשם לפני הסגירה
          blurTimer.current = setTimeout(() => setIsOpen(false), 120);
        }}
      />
      {showList && (
        <ul id={listId} className="autocomplete__list" role="listbox">
          {filtered.map((option) => (
            <li key={option} role="option" aria-selected={option === value}>
              <button
                type="button"
                className="autocomplete__item"
                // onMouseDown רץ לפני onBlur — כך הבחירה נרשמת
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  select(option);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}

export default Autocomplete;
