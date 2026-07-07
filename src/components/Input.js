/*
  Input — שדה טופס גנרי: תווית לכל שדה (נגישות) והודעת שגיאה צמודה אליו.
  כל prop נוסף (value, onChange, type, placeholder...) עובר ישירות ל-input.
*/
function Input({ id, label, error = "", ...inputProps }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`field__input${error ? " field__input--error" : ""}`}
        aria-invalid={error ? "true" : "false"}
        {...inputProps}
      />
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}

export default Input;
