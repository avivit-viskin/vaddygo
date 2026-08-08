import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterChips from "./FilterChips";

/*
  FilterChips הוא רכיב סינון גנרי שאינו מכיר את התוכן שהוא מסנן, ולכן הוא
  נבדק כאן מול אפשרויות סתמיות — בדיוק כפי שכל מסך עתידי ישתמש בו.
*/

test("לא מוצג כלל כשאין אפשרויות לסנן לפיהן", () => {
  const { container } = render(
    <FilterChips options={[]} value="" onChange={() => {}} label="קטגוריה" />
  );
  expect(container).toBeEmptyDOMElement();
});

test("מציג תווית, כפתור 'הכל' וכפתור לכל אפשרות", () => {
  render(
    <FilterChips
      options={["מתנות", "הסעדה"]}
      value=""
      onChange={() => {}}
      label="קטגוריה"
    />
  );

  expect(screen.getByText("קטגוריה:")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "הכל" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "מתנות" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "הסעדה" })).toBeInTheDocument();
});

test("בחירת אפשרות מדווחת החוצה, והנבחרת מסומנת לקוראי מסך", () => {
  const onChange = jest.fn();
  const { rerender } = render(
    <FilterChips options={["מתנות", "הסעדה"]} value="" onChange={onChange} />
  );

  // בלי בחירה — "הכל" הוא הפעיל
  expect(screen.getByRole("button", { name: "הכל" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  userEvent.click(screen.getByRole("button", { name: "הסעדה" }));
  expect(onChange).toHaveBeenCalledWith("הסעדה");

  rerender(
    <FilterChips
      options={["מתנות", "הסעדה"]}
      value="הסעדה"
      onChange={onChange}
    />
  );
  expect(screen.getByRole("button", { name: "הסעדה" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  expect(screen.getByRole("button", { name: "הכל" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
});

test("לחיצה על 'הכל' מנקה את הסינון", () => {
  const onChange = jest.fn();
  render(<FilterChips options={["מתנות"]} value="מתנות" onChange={onChange} />);

  userEvent.click(screen.getByRole("button", { name: "הכל" }));
  expect(onChange).toHaveBeenCalledWith("");
});