import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffBirthdays from "./StaffBirthdays";

/*
  מעל הרשימה מוצגת המלצה כללית אחת: 200 ₪ למתנה לכל איש צוות שהוגדר במספר
  אנשי הצוות של הגן (בהגדרות ההרשמה) — 3 אנשי צוות → 600 ₪.
  רשימת הצוות מדומה דרך global.fetch; מספר אנשי הצוות נטען מ-localStorage.
*/
const ONE = [{ id: 1, fullName: "רותי לוי", role: "גננת", birthDate: "1988-07-12" }];
const TWO = [
  { id: 1, fullName: "רותי לוי", role: "גננת", birthDate: "1988-07-12" },
  { id: 2, fullName: "דנה כהן", role: "סייעת", birthDate: "1990-03-04" },
];

function mockStaff(list) {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(list) })
  );
}

/* מספר אנשי הצוות מוגדר בהרשמת הגן ונשמר ב-localStorage */
function seedStaffCount(n) {
  localStorage.setItem(
    "vaadygo.onboarding",
    JSON.stringify({ staffCount: String(n) })
  );
}

afterEach(() => {
  delete global.fetch;
  localStorage.clear();
});

test("מציג המלצה: 200 ₪ לכל איש צוות (3 → 600), בלי אחוזים", async () => {
  seedStaffCount(3);
  mockStaff(TWO);
  render(<StaffBirthdays />);

  // 3 אנשי צוות × 200 ₪ = 600 — סכום כללי אחד לכל הצוות
  expect(
    await screen.findByText(/מומלץ להשקיע על מתנות לצוות: 600/)
  ).toBeInTheDocument();
  // בלי אחוזים (החישוב קבוע — 200 ₪ לאיש צוות)
  expect(screen.queryByText(/3%/)).not.toBeInTheDocument();
});

test("בלי אנשי צוות (0) לא מוצגת המלצה", async () => {
  seedStaffCount(0);
  mockStaff(ONE);
  render(<StaffBirthdays />);
  await screen.findByText("רותי לוי");
  expect(screen.queryByText(/מומלץ להשקיע/)).not.toBeInTheDocument();
});

test("מחיקת איש צוות: אישור מסיר אותו מהרשימה ושולח DELETE", async () => {
  let list = [...TWO];
  global.fetch = jest.fn((url, options = {}) => {
    if ((options.method ?? "GET") === "DELETE") {
      const id = Number(url.split("/").pop());
      list = list.filter((m) => m.id !== id);
      return Promise.resolve({ ok: true, status: 204 });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(list) });
  });

  render(<StaffBirthdays />);
  await screen.findByText("רותי לוי");

  await userEvent.click(screen.getByRole("button", { name: "מחיקת רותי לוי" }));
  await userEvent.click(screen.getByRole("button", { name: "כן, למחוק" }));

  await waitFor(() =>
    expect(screen.queryByText("רותי לוי")).not.toBeInTheDocument()
  );
  expect(screen.getByText("דנה כהן")).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/staff/1"),
    expect.objectContaining({ method: "DELETE" })
  );
});
