import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhoneActions from "./PhoneActions";

test("לחיצה על המספר פותחת אפשרויות חיוג ווואטסאפ עם הקישורים הנכונים", async () => {
  render(<PhoneActions phone="050-1234567" label="אמא" />);

  // לפני לחיצה — אין תפריט
  expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /050-1234567/ }));

  const call = screen.getByRole("menuitem", { name: /חיוג/ });
  expect(call).toHaveAttribute("href", "tel:050-1234567");

  const whatsapp = screen.getByRole("menuitem", { name: /וואטסאפ/ });
  // וואטסאפ דורש קידומת בינלאומית בלי אפס מוביל
  expect(whatsapp).toHaveAttribute("href", "https://wa.me/972501234567");
});

test("לחיצה שנייה על המספר סוגרת את התפריט", async () => {
  render(<PhoneActions phone="0500000000" />);
  const button = screen.getByRole("button", { name: /0500000000/ });

  await userEvent.click(button);
  expect(screen.getByRole("menuitem", { name: /חיוג/ })).toBeInTheDocument();

  await userEvent.click(button);
  expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
});

test("בלי מספר טלפון — לא מציג כלום", () => {
  const { container } = render(<PhoneActions phone="" />);
  expect(container).toBeEmptyDOMElement();
});
