import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CollectionCard from "./CollectionCard";

/*
  CollectionCard — מציג יתרת קופה + חוב פתוח, וכפתור "עדכון יתרה" שפותח
  רישום הוצאה ששולח POST לשרת.
*/
const dashboard = {
  boxBalance: 800,
  openDebt: 1200,
  progressPercent: 40,
  byPaymentMethod: [
    { method: "bit", amount: 500 },
    { method: "paybox", amount: 200 },
    { method: "cash", amount: 100 },
  ],
};

afterEach(() => {
  delete global.fetch;
});

test("מציג יתרת הקופה ואת החוב הפתוח", () => {
  render(<CollectionCard dashboard={dashboard} />);
  expect(screen.getByText("יתרת הקופה")).toBeInTheDocument();
  expect(screen.getByText("חוב פתוח")).toBeInTheDocument();
});

test("כפתור עדכון יתרה פותח רישום הוצאה ושולח POST לשרת", async () => {
  global.fetch = jest.fn((url, options = {}) => {
    const method = options.method ?? "GET";
    if (method === "GET") {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    }
    // POST expense
    return Promise.resolve({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 1, ...JSON.parse(options.body) }),
    });
  });
  const onExpenseChanged = jest.fn();

  render(<CollectionCard dashboard={dashboard} onExpenseChanged={onExpenseChanged} />);
  await userEvent.click(screen.getByRole("button", { name: /עדכון יתרה/ }));

  await userEvent.type(screen.getByLabelText("סכום הוצאה"), "250");
  await userEvent.click(screen.getByRole("button", { name: "הוספת הוצאה" }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/expenses"),
      expect.objectContaining({ method: "POST" })
    );
    expect(onExpenseChanged).toHaveBeenCalled();
  });
});
