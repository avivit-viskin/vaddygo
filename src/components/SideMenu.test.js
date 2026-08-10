import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SideMenu from "./SideMenu";
import { grantProLocally } from "../services/plan";

// מבודדים את מחליף המוסדות — לא מה שנבדק כאן
jest.mock("./InstitutionSwitcher", () => () => <div data-testid="switcher" />);

afterEach(() => localStorage.clear());

// התפריט משתמש בקישורי ניווט (react-router) ולכן צריך Router מסביב
function renderMenu(ui) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {ui}
    </MemoryRouter>
  );
}

test("תפריט סגור לא מציג כלום", () => {
  const { container } = renderMenu(<SideMenu isOpen={false} onClose={() => {}} />);
  expect(container).toBeEmptyDOMElement();
});

test("צור קשר פותח וואטסאפ למספר התמיכה, ויש כפתור התנתקות", () => {
  renderMenu(<SideMenu isOpen={true} onClose={() => {}} />);

  const contact = screen.getByRole("link", { name: /צור קשר/ });
  // 054-4579179 → 972544579179 (וואטסאפ דורש קידומת בלי אפס מוביל)
  expect(contact.getAttribute("href")).toContain("wa.me/972544579179");

  expect(screen.getByRole("button", { name: /התנתק/ })).toBeInTheDocument();
});

/*
  הוספת מוסד נוסף היא פיצ'ר פרו (החלטת בעלת המוצר, 10.08.2026): בלי מנוי
  הכפתור אינו פותח את הטופס אלא מוביל לעמוד השדרוג. מעבר בין מוסדות קיימים
  נשאר חינם, ולכן הכפתור עצמו כן מוצג — עם כתר.
*/
test("בלי פרו, 'הוסף מוסד' מוביל לשדרוג ולא פותח את הטופס", () => {
  renderMenu(<SideMenu isOpen={true} onClose={() => {}} />);

  const addButton = screen.getByRole("button", { name: /הוסף מוסד/ });
  userEvent.click(addButton);

  expect(screen.queryByLabelText("שם המוסד")).not.toBeInTheDocument();
});

test("עם פרו, 'הוסף מוסד' פותח את טופס ההוספה", () => {
  grantProLocally();
  renderMenu(<SideMenu isOpen={true} onClose={() => {}} />);

  userEvent.click(screen.getByRole("button", { name: /הוסף מוסד/ }));

  expect(screen.getByLabelText("שם המוסד")).toBeInTheDocument();
});
