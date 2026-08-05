import { getBranding, setBranding, clearLogo } from "./branding";

afterEach(() => localStorage.clear());

test("ברירת מחדל ריקה, ואפשר לקבוע לוגו וצבע בנפרד בלי לדרוס", () => {
  expect(getBranding()).toEqual({ logo: null, color: null });

  setBranding({ color: "#123456" });
  expect(getBranding().color).toBe("#123456");

  setBranding({ logo: "data:image/jpeg;base64,abc" });
  const b = getBranding();
  expect(b.logo).toBe("data:image/jpeg;base64,abc");
  expect(b.color).toBe("#123456"); // הצבע נשמר

  clearLogo();
  expect(getBranding().logo).toBeNull();
  expect(getBranding().color).toBe("#123456");
});
