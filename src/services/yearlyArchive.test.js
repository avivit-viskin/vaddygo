import { getSnapshots, saveSnapshot, deleteSnapshot, buildBackup } from "./yearlyArchive";

afterEach(() => localStorage.clear());

const dashboard = {
  ganName: "גן הרימון",
  year: 2026,
  childrenCount: 22,
  collectedTotal: 20000,
  boxBalance: 12000,
  byCategory: [{ name: "מתנות", spentAmount: 8000 }],
};

test("שמירת סיכום שנה ושליפתו", () => {
  saveSnapshot(dashboard);
  const snaps = getSnapshots();
  expect(snaps).toHaveLength(1);
  expect(snaps[0]).toMatchObject({
    year: 2026,
    collected: 20000,
    spent: 8000,
    balance: 12000,
    children: 22,
  });
});

test("שמירה חוזרת לאותה שנה מעדכנת ולא מכפילה", () => {
  saveSnapshot(dashboard);
  saveSnapshot({ ...dashboard, collectedTotal: 25000 });
  const snaps = getSnapshots();
  expect(snaps).toHaveLength(1);
  expect(snaps[0].collected).toBe(25000);
});

test("שתי שנים ממוינות, ומחיקה", () => {
  saveSnapshot({ ...dashboard, year: 2025 });
  saveSnapshot({ ...dashboard, year: 2026 });
  expect(getSnapshots().map((s) => s.year)).toEqual([2025, 2026]);
  deleteSnapshot(2025);
  expect(getSnapshots().map((s) => s.year)).toEqual([2026]);
});

test("גיבוי אוסף מפתחות vaadygo.* אך לא טוקן/משתמש", () => {
  localStorage.setItem("vaadygo.something", "x");
  localStorage.setItem("vaadygo.token", "secret");
  const backup = buildBackup();
  expect(backup.app).toBe("VaddyGo");
  expect(backup.data["vaadygo.something"]).toBe("x");
  expect(backup.data["vaadygo.token"]).toBeUndefined();
});
