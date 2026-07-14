import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExpenseAfterEventPrompt from "./ExpenseAfterEventPrompt";

afterEach(() => {
  delete global.fetch;
  localStorage.clear();
});

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

test("אירוע שעבר — קופץ, רושם הוצאה ושולח POST לשרת", async () => {
  global.fetch = jest.fn((url, options = {}) => {
    const method = options.method ?? "GET";
    if (method === "GET" && url.includes("/events")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            { id: 1, name: "טיול שנתי", eventDate: isoDaysAgo(1), description: "", location: "", reminder: false },
          ]),
      });
    }
    // POST expense
    return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({ id: 9 }) });
  });
  const onRecorded = jest.fn();

  render(<ExpenseAfterEventPrompt onRecorded={onRecorded} delayMs={0} />);

  expect(await screen.findByText(/טיול שנתי מאחורינו/)).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText("סכום הוצאה"), "300");
  await userEvent.click(screen.getByRole("button", { name: "רישום הוצאה" }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/expenses"),
      expect.objectContaining({ method: "POST" })
    );
    expect(onRecorded).toHaveBeenCalled();
  });
});

test("בלי אירועים שעברו — לא קופץ כלום", async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
  );
  render(<ExpenseAfterEventPrompt delayMs={0} />);
  // נותנים לטעינה האסינכרונית להסתיים
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  expect(screen.queryByText(/מאחורינו/)).not.toBeInTheDocument();
});
