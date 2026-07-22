import { login, getToken, isSubscriptionExpired } from "./authService";

/*
  אבטחה: החלפת משתמש באותו מכשיר חייבת לנקות את הנתונים המקומיים של הקודם
  (מוסדות, צוות וכו'), אחרת משתמש חדש "זוכר" נתונים של משתמש אחר.
*/
function mockAuth(username) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          token: `tok-${username}`,
          username,
          role: "Admin",
          subscriptionValidUntil: null,
        }),
    })
  );
}

afterEach(() => {
  delete global.fetch;
  localStorage.clear();
});

test("כניסת משתמש אחר מנקה את הנתונים המקומיים של הקודם", async () => {
  mockAuth("userA");
  await login({ usernameOrEmail: "userA", password: "x" });
  localStorage.setItem("vaadygo.institutions", JSON.stringify([{ id: 1, name: "גן א" }]));
  localStorage.setItem("vaadygo.staff", JSON.stringify([{ id: 1, fullName: "רותי" }]));

  mockAuth("userB");
  await login({ usernameOrEmail: "userB", password: "y" });

  expect(localStorage.getItem("vaadygo.institutions")).toBeNull();
  expect(localStorage.getItem("vaadygo.staff")).toBeNull();
  expect(getToken()).toBe("tok-userB");
});

test("כניסה חוזרת של אותו משתמש שומרת את הנתונים המקומיים שלו", async () => {
  mockAuth("userA");
  await login({ usernameOrEmail: "userA", password: "x" });
  localStorage.setItem("vaadygo.institutions", JSON.stringify([{ id: 1, name: "גן א" }]));

  mockAuth("userA");
  await login({ usernameOrEmail: "userA", password: "x" });

  expect(localStorage.getItem("vaadygo.institutions")).not.toBeNull();
});

describe("isSubscriptionExpired", () => {
  function setUser(subscriptionValidUntil) {
    localStorage.setItem(
      "vaadygo.user",
      JSON.stringify({ username: "u", subscriptionValidUntil })
    );
  }

  test("תאריך בעבר → פג (נעילה)", () => {
    setUser("2000-01-01T00:00:00Z");
    expect(isSubscriptionExpired()).toBe(true);
  });

  test("תאריך בעתיד → בתוקף", () => {
    setUser("2999-01-01T00:00:00Z");
    expect(isSubscriptionExpired()).toBe(false);
  });

  test("אין תאריך → לא נועלים (בטיחות)", () => {
    setUser(null);
    expect(isSubscriptionExpired()).toBe(false);
  });
});
