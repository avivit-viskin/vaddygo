import { render, screen } from "@testing-library/react";
import SideMenu from "./SideMenu";

// מבודדים את מחליף המוסדות — לא מה שנבדק כאן
jest.mock("./InstitutionSwitcher", () => () => <div data-testid="switcher" />);

test("תפריט סגור לא מציג כלום", () => {
  const { container } = render(<SideMenu isOpen={false} onClose={() => {}} />);
  expect(container).toBeEmptyDOMElement();
});

test("צור קשר פותח וואטסאפ למספר התמיכה, ויש כפתור התנתקות", () => {
  render(<SideMenu isOpen={true} onClose={() => {}} />);

  const contact = screen.getByRole("link", { name: /צור קשר/ });
  // 054-4579179 → 972544579179 (וואטסאפ דורש קידומת בלי אפס מוביל)
  expect(contact.getAttribute("href")).toContain("wa.me/972544579179");

  expect(screen.getByRole("button", { name: /התנתק/ })).toBeInTheDocument();
});
