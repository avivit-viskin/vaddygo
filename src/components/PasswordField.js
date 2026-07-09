import { useState } from "react";
import Input from "./Input";
import { evaluatePassword, generateStrongPassword } from "../utils/passwordStrength";

/*
  PasswordField — שדה סיסמה עם כפתור עין (הצג/הסתר), מד חוזק סיסמה,
  וכפתור "הצע לי סיסמה חזקה" שממלא סיסמה חזקה ומציג אותה.
  משתלב עם useForm: onChange מקבל אירוע רגיל, וההצעה קוראת לו עם אירוע סינתטי.
*/
function PasswordField({ id, name, label, value, error, onChange }) {
  const [show, setShow] = useState(false);
  const strength = evaluatePassword(value);

  function suggest() {
    const password = generateStrongPassword();
    onChange({ target: { name, value: password } });
    setShow(true); // מציגים כדי שהמשתמשת תראה ותשמור את הסיסמה שהוצעה
  }

  return (
    <div>
      <div className="password-field">
        <Input
          id={id}
          name={name}
          label={label}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          error={error}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="password-field__eye"
          aria-label={show ? "הסתרת סיסמה" : "הצגת סיסמה"}
          onClick={() => setShow((s) => !s)}
        >
          👁
        </button>
      </div>

      {value && (
        <div className="pw-strength" aria-live="polite">
          <div className="pw-strength__bars">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={
                  "pw-strength__bar" +
                  (strength.score >= i ? ` pw-strength__bar--${strength.level}` : "")
                }
              />
            ))}
          </div>
          <span className={`pw-strength__label pw-strength__label--${strength.level}`}>
            חוזק הסיסמה: {strength.label}
          </span>
        </div>
      )}

      <button type="button" className="pw-suggest" onClick={suggest}>
        ✨ הצע לי סיסמה חזקה
      </button>
    </div>
  );
}

export default PasswordField;
