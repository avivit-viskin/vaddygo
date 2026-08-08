/*
  vendorProducts — כללי התצוגה והשמירה של מוצרי ספק.

  שם המוצר אינו חובה (החלטת בעלת המוצר, 08.08.2026): ספק שמצלם מוצרים בטלפון
  רוצה לשמור קודם ולתת שמות אחר כך. לכן מוצר בלי שם נשמר כרגיל ומוצג בכל מסך
  כ"מוצר N" לפי מיקומו ברשימה. הכללים יושבים כאן במקום אחד כדי שכל המסכים
  (טופס העריכה, כרטיס הספק, הקטלוג הציבורי ופורטל הספק) יציגו בדיוק אותו דבר.
*/

/*
  productDisplayName — השם להצגה: השם שהוזן, ואם אין — "מוצר N" לפי המיקום.
  index הוא אינדקס מבוסס-אפס (כמו ב-map), והמספר המוצג מתחיל מ-1.
*/
export function productDisplayName(product, index = 0) {
  return (product?.name || "").trim() || `מוצר ${index + 1}`;
}

/*
  withDisplayNames — מוסיף לכל מוצר שדה displayName לפי סדר המוצרים של הספק.
  משתמשים בזה לפני קיבוץ לתיקיות/סינון, כדי שהמספור ("מוצר 3") יהיה יציב ולפי
  הרשימה המלאה — ולא יתחיל מחדש בכל תיקייה ויתנגש.
*/
export function withDisplayNames(products = []) {
  return products.map((product, index) => ({
    ...product,
    displayName: productDisplayName(product, index),
  }));
}

/*
  hasProductContent — האם יש במוצר תוכן כלשהו. שורה ריקה לגמרי (בלי שם, תיאור,
  מחיר, תמונה או תיקייה) נוצרת כשלוחצים "הוספת מוצר" ולא ממלאים כלום, ואין טעם
  לשמור אותה. כל שדה שמולא — מספיק כדי שהמוצר יישמר, גם בלי שם.
*/
export function hasProductContent(product) {
  if (!product) return false;
  return Boolean(
    (product.name || "").trim() ||
      (product.description || "").trim() ||
      Number(product.price) > 0 ||
      (product.imageUrl || "").trim() ||
      (product.folder || "").trim()
  );
}
