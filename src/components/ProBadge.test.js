import { render, screen } from "@testing-library/react";
import ProBadge from "./ProBadge";

test("מציג את תגית הפרו (כתר) עם tooltip ברירת מחדל", () => {
  render(<ProBadge />);
  expect(screen.getByTitle("פרו")).toBeInTheDocument();
});

test("מקבל title מותאם (למשל שם הפיצ'ר)", () => {
  render(<ProBadge title="עוזרת AI — פיצ'ר פרו" />);
  expect(screen.getByTitle("עוזרת AI — פיצ'ר פרו")).toBeInTheDocument();
});
