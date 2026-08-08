import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VendorForm from "./VendorForm";

/*
  בקשת בעלת המוצר (08.08.2026): מוצר בלי שם לא יימחק בשקט בשמירה, ואחרי
  "שמירה" ייפתח חלון "נשמר בהצלחה". שני הדברים נבדקים כאן מקצה לקצה בטופס.
*/

const vendorWithUnnamedProduct = {
  id: 1,
  name: "מתנות בלב",
  products: [{ name: "", price: 25, imageUrl: "https://x.test/cup.jpg" }],
};

test("מוצר בלי שם נשמר, ומוצג בטופס כ'מוצר 1'", async () => {
  const onSave = jest.fn().mockResolvedValue({ id: 1 });
  render(<VendorForm vendor={vendorWithUnnamedProduct} onSave={onSave} />);

  expect(screen.getByText("מוצר 1")).toBeInTheDocument();

  userEvent.click(screen.getAllByRole("button", { name: "שמירה" })[0]);

  await waitFor(() => expect(onSave).toHaveBeenCalled());
  const saved = onSave.mock.calls[0][0];
  expect(saved.products).toHaveLength(1);
  expect(saved.products[0]).toMatchObject({ name: "", price: 25 });
});

test("אחרי שמירה מוצלחת נפתח חלון 'נשמר בהצלחה'", async () => {
  const onSave = jest.fn().mockResolvedValue({ id: 1 });
  render(<VendorForm vendor={vendorWithUnnamedProduct} onSave={onSave} />);

  userEvent.click(screen.getAllByRole("button", { name: "שמירה" })[0]);

  expect(
    await screen.findByRole("dialog", { name: "נשמר בהצלחה" })
  ).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "הבנתי" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "נשמר בהצלחה" })
    ).not.toBeInTheDocument()
  );
});

test("שורת מוצר ריקה לגמרי לא נשמרת", async () => {
  const onSave = jest.fn().mockResolvedValue({ id: 1 });
  render(
    <VendorForm
      vendor={{ id: 1, name: "מתנות בלב", products: [] }}
      onSave={onSave}
    />
  );

  userEvent.click(screen.getByRole("button", { name: /הוספת מוצר/ }));
  userEvent.click(screen.getAllByRole("button", { name: "שמירה" })[0]);

  await waitFor(() => expect(onSave).toHaveBeenCalled());
  expect(onSave.mock.calls[0][0].products).toHaveLength(0);
});
