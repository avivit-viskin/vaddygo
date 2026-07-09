import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import PasswordField from "./PasswordField";
import { evaluatePassword, generateStrongPassword } from "../utils/passwordStrength";

/* עוטף קטן שמדמה שדה מבוקר, כמו ב-useForm */
function Harness() {
  const [value, setValue] = useState("");
  return (
    <PasswordField
      id="pw"
      name="password"
      label="סיסמה"
      value={value}
      error=""
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

test("סיסמה של ספרות בלבד מסומנת כחלשה, ומגוון תווים כחזקה", () => {
  expect(evaluatePassword("123456").label).toBe("חלשה");
  expect(evaluatePassword("Abc123!xyz789").level).toBe("very-strong");
});

test("הסיסמה המוצעת חזקה מאוד ובאורך סביר", () => {
  const pw = generateStrongPassword();
  expect(pw.length).toBeGreaterThanOrEqual(12);
  expect(evaluatePassword(pw).score).toBe(4);
});

test("כפתור ההצעה ממלא סיסמה ומציג מד חוזק", () => {
  render(<Harness />);
  userEvent.click(screen.getByRole("button", { name: /הצע לי סיסמה חזקה/ }));
  expect(screen.getByText(/חוזק הסיסמה:/)).toBeInTheDocument();
  // אחרי הצעה, הסיסמה מוצגת כטקסט (לא מוסתרת) וארוכה
  const input = screen.getByLabelText("סיסמה");
  expect(input.value.length).toBeGreaterThanOrEqual(12);
});
