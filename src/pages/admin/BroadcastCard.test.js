import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BroadcastCard from "./BroadcastCard";
import {
  getBroadcastRecipients,
  sendBroadcast,
} from "../../services/subscriptionsService";

jest.mock("../../services/subscriptionsService", () => ({
  ...jest.requireActual("../../services/subscriptionsService"),
  getBroadcastRecipients: jest.fn(),
  sendBroadcast: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  getBroadcastRecipients.mockResolvedValue({ count: 12 });
});

test("מציג לכמה בעלי מוסדות יישלח, לפני שלוחצים", async () => {
  render(<BroadcastCard />);
  expect(await screen.findByText("12")).toBeInTheDocument();
});

/*
  אין דרך לבטל מייל שיצא, ולכן השליחה עוברת אישור — ובאישור עצמו חוזר
  מספר הנמענים, כדי שההחלטה תתקבל מול המספר ולא מול "כולם".
*/
test("שליחה דורשת אישור, והאישור חוזר על מספר הנמענים", async () => {
  render(<BroadcastCard />);
  await screen.findByText("12");

  await userEvent.click(
    screen.getByRole("button", { name: /שליחה ל.*בעלי מוסדות/ })
  );

  expect(screen.getByText(/אי אפשר לבטל/)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /כן, לשלוח ל-12/ })
  ).toBeInTheDocument();
  expect(sendBroadcast).not.toHaveBeenCalled();
});

test("ביטול באישור אינו שולח דבר", async () => {
  render(<BroadcastCard />);
  await screen.findByText("12");

  await userEvent.click(
    screen.getByRole("button", { name: /שליחה ל.*בעלי מוסדות/ })
  );
  await userEvent.click(screen.getByRole("button", { name: "ביטול" }));

  expect(sendBroadcast).not.toHaveBeenCalled();
});

test("אישור שולח את הנוסח ומדווח כמה נשלחו", async () => {
  sendBroadcast.mockResolvedValue({ total: 12, sent: 12, failed: 0 });
  render(<BroadcastCard />);
  await screen.findByText("12");

  await userEvent.click(
    screen.getByRole("button", { name: /שליחה ל.*בעלי מוסדות/ })
  );
  await userEvent.click(screen.getByRole("button", { name: /כן, לשלוח ל-12/ }));

  expect(sendBroadcast).toHaveBeenCalledWith(
    expect.objectContaining({
      subject: expect.stringContaining("1.10"),
      body: expect.stringContaining("שום דבר לא נמחק"),
    })
  );
  expect(await screen.findByText(/נשלחו/)).toBeInTheDocument();
});

/* שליחה חלקית חייבת להיאמר — אחרת נראה שהכול הצליח. */
test("כשחלק נכשלו — נאמר כמה, ולא רק כמה הצליחו", async () => {
  sendBroadcast.mockResolvedValue({ total: 12, sent: 10, failed: 2 });
  render(<BroadcastCard />);
  await screen.findByText("12");

  await userEvent.click(
    screen.getByRole("button", { name: /שליחה ל.*בעלי מוסדות/ })
  );
  await userEvent.click(screen.getByRole("button", { name: /כן, לשלוח ל-12/ }));

  expect(await screen.findByText(/2 נכשלו/)).toBeInTheDocument();
});

test("בלי נמענים — הכפתור מנוטרל", async () => {
  getBroadcastRecipients.mockResolvedValue({ count: 0 });
  render(<BroadcastCard />);

  await screen.findByText("0");
  expect(
    screen.getByRole("button", { name: /שליחה ל.*בעלי מוסדות/ })
  ).toBeDisabled();
});

/* בחירת הקהל "נרשמו ולא סיימו" מבקשת מהשרת את מספר הנמענים של אותו קהל. */
test("בחירת קהל 'נרשמו ולא סיימו' טוענת את הספירה של אותו קהל", async () => {
  getBroadcastRecipients.mockResolvedValue({ count: 5 });
  render(<BroadcastCard />);
  await screen.findByText("5");

  await userEvent.click(
    screen.getByRole("radio", { name: /נרשמו ולא סיימו/ })
  );

  expect(getBroadcastRecipients).toHaveBeenCalledWith("incomplete");
});
