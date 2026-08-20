import {
  vendorChecklist,
  vendorProgress,
  vendorReportText,
} from "./vendorProgress";

/*
  אותם כללים משמשים גם את הצ'ק-ליסט של הספק וגם את דוח המנהלת — הבדיקות כאן
  מוודאות שהמדידה נכונה ושהטקסט לשיתוף מכיל את מה שהמנהלת צריכה לשלוח.
*/

const fullVendor = {
  name: "מתנות בלב",
  whatsApp: "054-1234567",
  products: [{ name: "כוס", imageUrl: "https://x.test/cup.jpg" }],
  paymentBit: "054-1234567",
  hasLogin: true,
  views: 40,
  leads: 6,
};

test("ספק ריק — 0% והכל חסר", () => {
  const { done, total, percent, missing } = vendorProgress({});
  expect(done).toBe(0);
  expect(total).toBe(5);
  expect(percent).toBe(0);
  expect(missing).toHaveLength(5);
});

test("ספק מלא — 100% ובלי חסרים", () => {
  const { done, total, percent, missing } = vendorProgress(fullVendor);
  expect(done).toBe(total);
  expect(percent).toBe(100);
  expect(missing).toEqual([]);
});

test("מוצר בלי שם נחשב 'מוצר ראשון' (שם אינו חובה)", () => {
  const items = vendorChecklist({ products: [{ name: "", price: 12 }] });
  expect(items.find((i) => i.key === "product").done).toBe(true);
  // בלי תמונה — פריט התמונה עדיין פתוח
  expect(items.find((i) => i.key === "image").done).toBe(false);
});

test("טקסט הדוח מכיל את המספרים ואת מה שנשאר להשלים", () => {
  const text = vendorReportText({
    name: "בלונים ועוד",
    views: 12,
    leads: 3,
    products: [{ name: "בלון" }],
  });

  expect(text).toContain("בלונים ועוד");
  expect(text).toContain("צפיות בקטלוג: 12");
  expect(text).toContain("פניות מוועדים: 3");
  expect(text).toContain("מוצרים בכרטיס: 1");
  expect(text).toContain("נשאר להשלים:");
  expect(text).toContain("אמצעי תשלום");
});

test("ספק שהשלים הכל מקבל טקסט חיובי בלי רשימת חסרים", () => {
  const text = vendorReportText(fullVendor);
  expect(text).toContain("100%");
  expect(text).toContain("הכרטיס מלא ומוכן");
  expect(text).not.toContain("נשאר להשלים");
});

/*
  כפתור "מילוי »" מנווט למסך לפי השדה `view`. באג אמיתי שהתגלה בשימוש: פריט
  הוואטסאפ הצביע על מסך המוצרים — שם אותו טופס מרונדר עם hideBusinessDetails,
  כלומר שדה הוואטסאפ **אינו קיים במסך**. הלחיצה נראתה כאילו אינה עושה דבר.

  הבדיקה נועלת את היעד של כל פריט למסך שבו השדה שלו באמת מוצג.
*/
test("כל פריט בצ'ק-ליסט מפנה למסך שבו השדה שלו קיים", () => {
  const views = Object.fromEntries(
    vendorChecklist({}).map((i) => [i.key, i.view])
  );

  // פרטי העסק (ובהם הוואטסאפ) מוצגים במסך ההגדרות בלבד
  expect(views.whatsApp).toBe("settings");
  // המוצרים והתמונות — במסך המוצרים
  expect(views.product).toBe("products");
  expect(views.image).toBe("products");
  // אמצעי תשלום — במסך התשלומים
  expect(views.payment).toBe("payments");
  // הגדרת מייל וסיסמה — בעמוד הבית של הפורטל
  expect(views.login).toBe("home");
});

test("לכל פריט בצ'ק-ליסט יש יעד ניווט", () => {
  for (const item of vendorChecklist({})) {
    expect(typeof item.view).toBe("string");
    expect(item.view.length).toBeGreaterThan(0);
  }
});
