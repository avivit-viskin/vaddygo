import { getStaff, deleteStaffMember } from "./staffService";

/*
  getStaff — כשההוספה לשרת נכשלה, איש הצוות נשמר מקומית (isLocal). הפונקציה
  צריכה למזג אותו עם רשימת השרת כדי שההוספה לא "תיעלם" כשהשרת מחזיר רשימה בלעדיו.
*/
function mockServerStaff(list) {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(list) })
  );
}

afterEach(() => {
  delete global.fetch;
  localStorage.clear();
});

test("ממזג איש צוות שנשמר מקומית עם רשימת השרת", async () => {
  localStorage.setItem(
    "vaadygo.staff",
    JSON.stringify([
      { id: 111, fullName: "רותי לוי", role: "גננת", birthDate: "1988-07-12", isLocal: true },
    ])
  );
  mockServerStaff([{ id: 1, fullName: "דנה כהן", role: "סייעת", birthDate: "1990-03-04" }]);

  const names = (await getStaff()).map((s) => s.fullName);
  expect(names).toContain("דנה כהן"); // מהשרת
  expect(names).toContain("רותי לוי"); // המקומי — לא נעלם
});

test("לא מכפיל איש צוות שכבר קיים בשרת (אותו שם ותאריך לידה)", async () => {
  localStorage.setItem(
    "vaadygo.staff",
    JSON.stringify([
      { id: 111, fullName: "דנה כהן", role: "סייעת", birthDate: "1990-03-04", isLocal: true },
    ])
  );
  mockServerStaff([{ id: 1, fullName: "דנה כהן", role: "סייעת", birthDate: "1990-03-04T00:00:00Z" }]);

  const staff = await getStaff();
  expect(staff.filter((s) => s.fullName === "דנה כהן")).toHaveLength(1);
});

test("מחיקת איש צוות מקומי מסירה אותו מ-localStorage בלי קריאה לשרת", async () => {
  localStorage.setItem(
    "vaadygo.staff",
    JSON.stringify([
      { id: 111, fullName: "רותי לוי", role: "גננת", birthDate: "1988-07-12", isLocal: true },
      { id: 222, fullName: "דנה כהן", role: "סייעת", birthDate: "1990-03-04", isLocal: true },
    ])
  );
  global.fetch = jest.fn();

  await deleteStaffMember(111);

  expect(JSON.parse(localStorage.getItem("vaadygo.staff")).map((m) => m.id)).toEqual([222]);
  expect(global.fetch).not.toHaveBeenCalled();
});

test("מחיקת איש צוות מהשרת שולחת DELETE לנתיב הנכון", async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, status: 204 }));

  await deleteStaffMember(7);

  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/staff/7"),
    expect.objectContaining({ method: "DELETE" })
  );
});
