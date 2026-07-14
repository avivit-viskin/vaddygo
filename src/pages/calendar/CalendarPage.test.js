import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CalendarPage from "../CalendarPage";

// כל טסט מתחיל מלוח נקי (האירועים נשמרים בינתיים ב-localStorage)
afterEach(() => {
  localStorage.clear();
});

test("מציג את כותרת החודש ואת ימות השבוע", async () => {
  render(<CalendarPage initialDate={new Date(2026, 11, 15)} />);
  expect(await screen.findByText("דצמבר 2026")).toBeInTheDocument();
  expect(screen.getByText("שבת")).toBeInTheDocument();
});

test("מציג את חנוכה בדצמבר 2026 (חישוב מהתאריך העברי)", async () => {
  render(<CalendarPage initialDate={new Date(2026, 11, 1)} />);
  const badges = await screen.findAllByText(/חנוכה/);
  expect(badges.length).toBeGreaterThan(0);
});

test("מציג את ראש השנה בספטמבר 2026", async () => {
  render(<CalendarPage initialDate={new Date(2026, 8, 1)} />);
  const badges = await screen.findAllByText(/ראש השנה/);
  expect(badges.length).toBeGreaterThan(0);
});

test("ניווט לחודש הבא מעדכן את הכותרת", async () => {
  render(<CalendarPage initialDate={new Date(2026, 11, 15)} />);
  await screen.findByText("דצמבר 2026");
  fireEvent.click(screen.getByRole("button", { name: "החודש הבא" }));
  expect(screen.getByText("ינואר 2027")).toBeInTheDocument();
});

test("הוספת אירוע חדש מציגה אותו בלוח וברשימה", async () => {
  render(<CalendarPage initialDate={new Date(2026, 11, 15)} />);
  await screen.findByText("דצמבר 2026");

  fireEvent.click(screen.getByRole("button", { name: "+ הוספת אירוע" }));
  fireEvent.change(screen.getByLabelText("שם האירוע *"), {
    target: { value: "מסיבת חנוכה" },
  });
  fireEvent.change(screen.getByLabelText("תאריך *"), {
    target: { value: "2026-12-10" },
  });
  fireEvent.click(screen.getByRole("button", { name: "שמירת האירוע" }));

  const shown = await screen.findAllByText("מסיבת חנוכה");
  expect(shown.length).toBeGreaterThan(0);
});

test("טופס האירוע לא נשלח בלי שם ותאריך", async () => {
  render(<CalendarPage initialDate={new Date(2026, 11, 15)} />);
  await screen.findByText("דצמבר 2026");

  fireEvent.click(screen.getByRole("button", { name: "+ הוספת אירוע" }));
  fireEvent.change(screen.getByLabelText("תאריך *"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "שמירת האירוע" }));

  expect(await screen.findByText("מה שם האירוע?")).toBeInTheDocument();
});

test("מדור החגים מציג שם, תאריך וכפתור תקציב לכל חג", async () => {
  render(<CalendarPage initialDate={new Date(2026, 11, 1)} />);
  await screen.findByText("דצמבר 2026");

  expect(
    screen.getByRole("button", { name: "הגדרת תקציב לחג חנוכה" })
  ).toBeInTheDocument();
});

test("הגדרת תקציב לחג: חלון עם הנוסח, שמירה והצגה ליד החג", async () => {
  render(<CalendarPage initialDate={new Date(2026, 11, 1)} />);
  await screen.findByText("דצמבר 2026");

  fireEvent.click(screen.getByRole("button", { name: "הגדרת תקציב לחג חנוכה" }));

  // הנוסח של בעלת המוצר, עם VaddyGo מודגש
  expect(
    screen.getByText(/לפני שנמשיך לנהל נכון בעזרת/)
  ).toBeInTheDocument();
  const brand = screen.getByText("VaddyGo");
  expect(brand.tagName).toBe("STRONG");

  fireEvent.change(screen.getByLabelText('סכום (בש"ח) *'), {
    target: { value: "800" },
  });
  fireEvent.click(screen.getByRole("button", { name: "שמירת התקציב" }));

  expect(
    await screen.findByRole("button", { name: "עריכת התקציב לחג חנוכה" })
  ).toBeInTheDocument();
  expect(screen.getByText(/תקציב: 800/)).toBeInTheDocument();
});

test("תקציב חג לא נשמר בלי סכום תקין", async () => {
  render(<CalendarPage initialDate={new Date(2026, 11, 1)} />);
  await screen.findByText("דצמבר 2026");

  fireEvent.click(screen.getByRole("button", { name: "הגדרת תקציב לחג חנוכה" }));
  fireEvent.click(screen.getByRole("button", { name: "שמירת התקציב" }));

  expect(
    await screen.findByText(/נא להזין סכום בש״ח/)
  ).toBeInTheDocument();
});

test("לחיצה על יום בלוח פותחת הוספת אירוע עם התאריך שנבחר", async () => {
  render(<CalendarPage initialDate={new Date(2026, 11, 15)} />);
  await screen.findByText("דצמבר 2026");

  fireEvent.click(screen.getByRole("button", { name: "הוספת אירוע ב-10 בחודש" }));
  expect(screen.getByLabelText("תאריך *")).toHaveValue("2026-12-10");
});

test("עריכת אירוע קיים מעדכנת את שמו ברשימה ובלוח", async () => {
  localStorage.setItem(
    "vaadygo.events",
    JSON.stringify([
      { id: 1, name: "טיול גן", eventDate: "2026-12-08", reminder: false },
    ])
  );
  render(<CalendarPage initialDate={new Date(2026, 11, 15)} />);
  await screen.findAllByText("טיול גן");

  fireEvent.click(screen.getByRole("button", { name: "עריכת האירוע טיול גן" }));
  fireEvent.change(screen.getByLabelText("שם האירוע *"), {
    target: { value: "טיול שנתי" },
  });
  fireEvent.click(screen.getByRole("button", { name: "עדכון האירוע" }));

  await waitFor(() =>
    expect(screen.getAllByText("טיול שנתי").length).toBeGreaterThan(0)
  );
  expect(screen.queryAllByText("טיול גן")).toHaveLength(0);
});

test("מחיקת אירוע עם אישור מסירה אותו מהרשימה", async () => {
  localStorage.setItem(
    "vaadygo.events",
    JSON.stringify([
      { id: 1, name: "טיול גן", eventDate: "2026-12-08", reminder: false },
    ])
  );
  render(<CalendarPage initialDate={new Date(2026, 11, 15)} />);
  await screen.findAllByText("טיול גן");

  fireEvent.click(
    screen.getByRole("button", { name: "מחיקת האירוע טיול גן" })
  );
  fireEvent.click(screen.getByRole("button", { name: "מחיקה" }));

  await waitFor(() =>
    expect(screen.queryAllByText("טיול גן")).toHaveLength(0)
  );
});
