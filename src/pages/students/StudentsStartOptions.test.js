import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudentsStartOptions from "./StudentsStartOptions";

/*
  המסך הריק הוא נקודת הנטישה של המערכת: ועדים פתחו גן ולא הזינו תלמידים.
  הבדיקות שומרות על מה שפותר את זה — ששתי הדרכים מוצגות, ושקובץ משרד החינוך
  נאמר במפורש ולא נשאר ידע סמוי.
*/
test("מציג את שתי הדרכים להתחיל", () => {
  render(<StudentsStartOptions onAddOne={() => {}} onImport={() => {}} />);

  expect(screen.getByText("להוסיף ילד אחד")).toBeInTheDocument();
  expect(screen.getByText("להעלות קובץ עם כל הרשימה")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "הוספת תלמיד" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "ייבוא מקובץ" })).toBeInTheDocument();
});

/* זה הקובץ שכבר ביד של מנהלת המוסד — ואיש לא מנחש לבד שהמערכת קוראת אותו. */
test("אומר במפורש שאפשר להעלות את קובץ משרד החינוך", () => {
  render(<StudentsStartOptions onAddOne={() => {}} onImport={() => {}} />);
  expect(screen.getByText(/משרד/)).toBeInTheDocument();
  expect(screen.getByText(/החינוך/)).toBeInTheDocument();
});

test("כל כפתור מפעיל את הפעולה שלו", async () => {
  const onAddOne = jest.fn();
  const onImport = jest.fn();
  render(<StudentsStartOptions onAddOne={onAddOne} onImport={onImport} />);

  await userEvent.click(screen.getByRole("button", { name: "הוספת תלמיד" }));
  expect(onAddOne).toHaveBeenCalledTimes(1);
  expect(onImport).not.toHaveBeenCalled();

  await userEvent.click(screen.getByRole("button", { name: "ייבוא מקובץ" }));
  expect(onImport).toHaveBeenCalledTimes(1);
});
