/*
  Select — שדה בחירה גנרי באותו עיצוב של Input: תווית לכל שדה (נגישות)
  והודעת שגיאה צמודה. האופציות מגיעות כ-children.
*/
function Select({ id, label, error = "", children, ...selectProps }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className={`field__input${error ? " field__input--error" : ""}`}
        aria-invalid={error ? "true" : "false"}
        {...selectProps}
      >
        {children}
      </select>
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}

export default Select;
