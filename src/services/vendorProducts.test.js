import {
  productDisplayName,
  withDisplayNames,
  hasProductContent,
} from "./vendorProducts";

/*
  שם המוצר אינו חובה (החלטת בעלת המוצר, 08.08.2026). הכללים כאן הם מקור האמת
  לכל המסכים: איך קוראים למוצר בלי שם, ומה בכלל שווה לשמור.
*/

test("מוצר עם שם מוצג בשמו; מוצר בלי שם מוצג כ'מוצר N'", () => {
  expect(productDisplayName({ name: "כוס מעוצבת" }, 0)).toBe("כוס מעוצבת");
  expect(productDisplayName({ name: "  " }, 2)).toBe("מוצר 3");
  expect(productDisplayName({}, 0)).toBe("מוצר 1");
});

test("withDisplayNames ממספר לפי הרשימה המלאה ולא משנה את שאר השדות", () => {
  const products = [
    { name: "", price: 10 },
    { name: "בלון", price: 5 },
    { name: "", price: 7 },
  ];

  const withNames = withDisplayNames(products);

  expect(withNames.map((p) => p.displayName)).toEqual([
    "מוצר 1",
    "בלון",
    "מוצר 3",
  ]);
  expect(withNames[0].price).toBe(10);
  // המקור לא שונה
  expect(products[0].displayName).toBeUndefined();
});

test("שורה ריקה לגמרי לא נשמרת, אבל מוצר בלי שם עם תוכן כן", () => {
  expect(hasProductContent({ name: "", price: 0, imageUrl: "" })).toBe(false);
  expect(hasProductContent({})).toBe(false);
  expect(hasProductContent(null)).toBe(false);

  expect(hasProductContent({ name: "בלון" })).toBe(true);
  expect(hasProductContent({ name: "", price: 20 })).toBe(true);
  expect(hasProductContent({ name: "", imageUrl: "data:image/png;base64," })).toBe(
    true
  );
  expect(hasProductContent({ name: "", description: "לבחירה" })).toBe(true);
  expect(hasProductContent({ name: "", folder: "פסח" })).toBe(true);
});
