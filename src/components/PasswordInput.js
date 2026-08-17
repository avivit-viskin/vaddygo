import { useState } from "react";
import Input from "./Input";
import "../styles/password-input.css";

/*
  PasswordInput — שדה סיסמה עם כפתור עין (הצג/הסתר) בלבד, לשימוש בכל מקום שמזינים
  בו סיסמה (התחברות/שער/שינוי/מפתח סודי). בלי מד-חוזק/הצעת-סיסמה (לזה יש
  PasswordField). כל prop נוסף (autoComplete/placeholder/name...) עובר ל-Input
  ומשם ל-<input>. ה-CSS co-located כדי שהעין תמוקם נכון בכל עמוד, גם lazy.
*/
function PasswordInput({ id, label, value, onChange, error = "", ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-field">
      <Input
        id={id}
        label={label}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        error={error}
        {...rest}
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
  );
}

export default PasswordInput;
