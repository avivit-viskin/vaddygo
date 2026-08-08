/*
  vendorProgress — "כמה הכרטיס של הספק מוכן". מקור אמת יחיד לשני הצדדים:
  הספק רואה את זה כצ'ק-ליסט ("מה נשאר לי להשלים"), והמנהלת רואה את אותם
  נתונים בדיוק כדוח התקדמות ("איפה הספק הזה עומד"). כך שני הצדדים לעולם לא
  מראים מספרים סותרים.

  view = לאיזה מסך בפורטל הספק הפריט שייך (משמש את הקישור "מילוי »").
*/
export function vendorChecklist(vendor) {
  const products = vendor?.products || [];
  return [
    {
      key: "whatsApp",
      done: Boolean(vendor?.whatsApp),
      label: "מספר וואטסאפ ליצירת קשר",
      view: "products",
    },
    {
      key: "product",
      // שם המוצר אינו חובה — די בכך שנוסף מוצר (למשל תמונה בלבד)
      done: products.length > 0,
      label: "מוצר ראשון",
      view: "products",
    },
    {
      key: "image",
      done: products.some((p) => (p.imageUrl || "").trim()),
      label: "תמונה לפחות למוצר אחד",
      view: "products",
    },
    {
      key: "payment",
      done: Boolean(
        vendor?.paymentLink || vendor?.paymentBit || vendor?.paymentBankInfo
      ),
      label: "אמצעי תשלום",
      view: "payments",
    },
    {
      key: "login",
      done: Boolean(vendor?.hasLogin),
      label: "הגדרת כניסה קבועה (מייל וסיסמה)",
      view: "home",
    },
  ];
}

/*
  vendorProgress — סיכום מספרי של הצ'ק-ליסט: כמה הושלמו, מתוך כמה, ובאחוזים,
  ומה עדיין חסר (לרשימה בדוח של המנהלת).
*/
export function vendorProgress(vendor) {
  const items = vendorChecklist(vendor);
  const done = items.filter((i) => i.done).length;
  return {
    items,
    done,
    total: items.length,
    percent: Math.round((done / items.length) * 100),
    missing: items.filter((i) => !i.done).map((i) => i.label),
  };
}

/*
  vendorReportText — הדוח כטקסט לשיתוף (וואטסאפ / העתקה ללוח). המנהלת שולחת
  אותו לספק כדי שיֵדע איפה הוא עומד ומה נשאר להשלים.
*/
export function vendorReportText(vendor) {
  const { done, total, percent, missing } = vendorProgress(vendor);
  const lines = [
    `דוח ספק — ${vendor?.name || "ספק"} (VaddyGo)`,
    `צפיות בקטלוג: ${vendor?.views || 0}`,
    `פניות מוועדים: ${vendor?.leads || 0}`,
    `מוצרים בכרטיס: ${(vendor?.products || []).length}`,
    `השלמת הכרטיס: ${done}/${total} (${percent}%)`,
  ];
  if (missing.length > 0) {
    lines.push("", "נשאר להשלים:", ...missing.map((m) => `• ${m}`));
  } else {
    lines.push("", "הכרטיס מלא ומוכן 🎉");
  }
  return lines.join("\n");
}
