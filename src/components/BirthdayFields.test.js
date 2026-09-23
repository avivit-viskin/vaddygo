import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BirthdayFields, {
  splitBirthday,
  joinBirthday,
  daysInMonth,
  PLACEHOLDER_YEAR,
} from "./BirthdayFields";

/*
  הדרישה מבדיקת הפרטיות: יום וחודש בלבד, בלי שנת לידה. הבדיקות שומרות על
  שני הצדדים — שהשנה לא נשמרת, ושהיום והחודש כן עובדים (אחרת ברכות יום
  ההולדת נשברות והפיצ'ר מת בשקט).
*/
describe("פירוק והרכבה", () => {
  test("מפרק תאריך ליום וחודש", () => {
    expect(splitBirthday("2000-03-14")).toEqual({ day: 14, month: 3 });
  });

  test("מרכיב תמיד עם שנת-הדמה — לעולם לא שנה אמיתית", () => {
    expect(joinBirthday(14, 3)).toBe(`${PLACEHOLDER_YEAR}-03-14`);
    expect(joinBirthday(5, 11)).toBe(`${PLACEHOLDER_YEAR}-11-05`);
  });

  test("חסר יום או חודש — אין חצי תאריך", () => {
    expect(joinBirthday(0, 3)).toBe("");
    expect(joinBirthday(14, 0)).toBe("");
  });

  test("ערך ריק או שגוי לא מפיל", () => {
    expect(splitBirthday("")).toEqual({ day: "", month: "" });
    expect(splitBirthday(null)).toEqual({ day: "", month: "" });
    expect(splitBirthday("לא-תאריך")).toEqual({ day: "", month: "" });
  });

  /* 29.2 קיים — ילד שנולד בשנה מעוברת לא ייחסם */
  test("פברואר מגיע עד 29", () => {
    expect(daysInMonth(2)).toBe(29);
    expect(daysInMonth(4)).toBe(30);
    expect(daysInMonth(1)).toBe(31);
  });
});

describe("השדות במסך", () => {
  test("אין שדה שנה — לא מבקשים מה שלא שומרים", () => {
    render(<BirthdayFields value="" onChange={() => {}} />);
    expect(screen.queryByLabelText(/שנה/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/יום/)).toBeInTheDocument();
    expect(screen.getByLabelText(/חודש/)).toBeInTheDocument();
  });

  test("בחירת חודש מחזירה תאריך עם שנת-הדמה", async () => {
    const onChange = jest.fn();
    render(<BirthdayFields value="2000-03-14" onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText(/חודש/), "5");
    expect(onChange).toHaveBeenCalledWith("2000-05-14");
  });

  test("בחירת יום מחזירה תאריך עם שנת-הדמה", async () => {
    const onChange = jest.fn();
    render(<BirthdayFields value="2000-03-14" onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText(/יום/), "21");
    expect(onChange).toHaveBeenCalledWith("2000-03-21");
  });

  test("מציג את הערך הקיים", () => {
    render(<BirthdayFields value="2000-07-09" onChange={() => {}} />);
    expect(screen.getByLabelText(/יום/)).toHaveValue("9");
    expect(screen.getByLabelText(/חודש/)).toHaveValue("7");
  });
});
