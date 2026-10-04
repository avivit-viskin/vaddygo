import { render, screen } from "@testing-library/react";
import Skeleton, { SkeletonCard, SkeletonLine } from "./Skeleton";

/*
  שלד טעינה אינו קישוט: הוא מחזיק את הגובה כדי שהמסך לא יקפוץ, והוא
  מחליף **אזור תוכן** ולא מסך שלם — כדי שלא יפרק חלונות פתוחים.
*/
test("מציג מספר שלדים לפי count", () => {
  const { container } = render(<Skeleton count={4} />);
  expect(container.querySelectorAll(".skeleton-card")).toHaveLength(4);
});

test("מודיע לקורא מסך פעם אחת, ולא על כל מלבן", () => {
  render(<Skeleton count={3} label="טוען את רשימת התלמידים..." />);

  // הודעה אחת על המיכל
  const status = screen.getByRole("status");
  expect(status).toHaveAttribute("aria-label", "טוען את רשימת התלמידים...");

  // והמלבנים עצמם מוסתרים — אין טעם להקריא "מלבן אפור" שבע פעמים
  const { container } = render(<SkeletonCard />);
  expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
});

test("שורה מקבלת את המידות שביקשו — כך השלד בגודל התוכן האמיתי", () => {
  const { container } = render(<SkeletonLine width="40%" height={22} />);
  const line = container.firstChild;
  expect(line).toHaveStyle({ width: "40%", height: "22px" });
});

/*
  🔴 הבדיקה שמגינה על הלקח מ-30.09: רענון שמחזיר את המסך למצב טעינה מפרק
  כל מה שפתוח בתוכו. שלד שמרונדר **לצד** תוכן אחר אינו מסיר אותו.
*/
test("שלד לצד תוכן פתוח אינו מסיר אותו", () => {
  render(
    <div>
      <div data-testid="open-modal">חלון פתוח</div>
      <Skeleton count={2} />
    </div>
  );

  expect(screen.getByTestId("open-modal")).toBeInTheDocument();
  expect(screen.getByRole("status")).toBeInTheDocument();
});
