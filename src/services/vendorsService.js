import { api } from "./api";

/*
  vendorsService — ספקי הוועד (UI_SPEC ס' 12): שם, קישור לקטלוג, ומוצרים
  (שם + מחיר). בלחיצה על ספק במסך המתנות נפתח דף עם המוצרים והקטלוג.
  API-first עם נפילה חיננית ל-localStorage, כמו שאר השירותים.
*/
const STORAGE_KEY = "vaadygo.vendors";

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeLocal(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* מונה פניות — נקרא כשוועד לוחץ "בקשת הצעת מחיר" (fire-and-forget, לא חוסם). */
export function recordLead(vendorId) {
  return api.post(`/api/public/vendors/${vendorId}/lead`).catch(() => {});
}

/* סימון/ביטול "ספק מומלץ" — מנהלת VaddyGo בלבד (נאכף בשרת). */
export function setVendorFeatured(id, featured) {
  return api.put(`/api/vendors/${id}/featured`, { featured });
}

/* פתיחה/סגירה של מסלול פרו לספק — מנהלת VaddyGo בלבד (נאכף בשרת). */
export function setVendorPro(id, isPro) {
  return api.put(`/api/vendors/${id}/pro`, { isPro });
}

export async function getVendors() {
  try {
    return await api.get("/api/vendors");
  } catch {
    return readLocal();
  }
}

export async function addVendor(vendor) {
  try {
    return await api.post("/api/vendors", vendor);
  } catch {
    const created = { ...vendor, id: Date.now(), isLocal: true };
    writeLocal([...readLocal(), created]);
    return created;
  }
}

export async function updateVendor(id, vendor) {
  try {
    return await api.put(`/api/vendors/${id}`, vendor);
  } catch {
    const list = readLocal().map((v) => (v.id === id ? { ...v, ...vendor } : v));
    writeLocal(list);
    return list.find((v) => v.id === id) || null;
  }
}

export async function deleteVendor(id) {
  try {
    await api.del(`/api/vendors/${id}`);
  } catch {
    writeLocal(readLocal().filter((v) => v.id !== id));
  }
}

/*
  עריכה עצמית של הספק דרך קישור אישי (פורטל ספקים, שלב 1). המנהל מייצר קישור
  ושולח לספק; הספק פותח אותו (בלי התחברות), עורך את הכרטיס שלו, וזה מופיע מיד
  לוועדים — אותו נתון בדיוק. אין נפילה מקומית: אלה פעולות שרת בלבד.
*/
export async function generateVendorEditLink(id) {
  const { editToken } = await api.post(`/api/vendors/${id}/edit-link`);
  return editToken;
}

export async function getVendorByToken(token) {
  return api.get(`/api/public/vendors/${token}`);
}

export async function updateVendorByToken(token, vendor) {
  return api.put(`/api/public/vendors/${token}`, vendor);
}

/*
  התחברות ספק (שלב 2): הספק מגדיר מייל+סיסמה דרך עמוד העריכה שלו, וכך יוכל
  לחזור בלי הקישור. ההתחברות מאמתת ומחזירה את טוקן העריכה (הלקוח ממשיך איתו).
*/
export async function setVendorCredentials(token, credentials) {
  return api.put(`/api/public/vendors/${token}/credentials`, credentials);
}

export async function supplierLogin(credentials) {
  const { editToken } = await api.post("/api/public/vendors/login", credentials);
  return editToken;
}

/* כניסת ספק עם Google — שולח את ה-credential מכפתור גוגל ומקבל את טוקן העריכה. */
export async function supplierLoginWithGoogle(credential) {
  const { editToken } = await api.post("/api/public/vendors/google-login", {
    credential,
  });
  return editToken;
}

/*
  הרשמת ספק חדש בעצמו (שם עסק + מייל + סיסמה). מחזיר את טוקן העריכה, והלקוח
  ממשיך איתו לעמוד מילוי הכרטיס והמוצרים.
*/
export async function registerVendor({ name, loginEmail, password }) {
  const { editToken } = await api.post("/api/public/vendors/register", {
    name,
    loginEmail,
    password,
  });
  return editToken;
}

/*
  איפוס סיסמה לספק (כמו למנוי): שלב 1 — בקשת קוד חד-פעמי למייל שהספק הגדיר;
  שלב 2 — הזנת הקוד + סיסמה חדשה. מטעמי אבטחה השרת לא חושף אם המייל קיים.
*/
export async function requestVendorPasswordReset(email) {
  return api.post("/api/public/vendors/forgot-password", { email });
}

export async function resetVendorPassword({ loginEmail, code, newPassword }) {
  return api.post("/api/public/vendors/reset-password", {
    loginEmail,
    code,
    newPassword,
  });
}

/* שינוי סיסמה של ספק מחובר (דרך הטוקן) — מאזור "חשבון וסיסמה" בתפריט הספק. */
export async function changeVendorPassword(token, newPassword) {
  return api.put(`/api/public/vendors/${token}/password`, { newPassword });
}

/* בקשת מחיקת חשבון מצד הספק (דרך הטוקן) — נרשמת בשרת וממתינה לאישור VaddyGo. */
export async function requestVendorDeletion(token) {
  return api.post(`/api/public/vendors/${token}/request-deletion`);
}

/* ביטול בקשת מחיקה ע"י המנהלת (SuperAdmin) — בלי למחוק את הספק. */
export async function dismissVendorDeletion(id) {
  return api.post(`/api/vendors/${id}/dismiss-deletion`);
}

/*
  רכישת מסלול פרו על ידי הספק עצמו. מחזיר את כתובת עמוד התשלום המאובטח של ספק
  הסליקה — שאליה מפנים את הספק. המסלול נפתח בפועל רק כשספק הסליקה מאשר את
  התשלום לשרת שלנו (webhook), ולא בחזרה לדפדפן.
*/
export async function startVendorProCheckout(token) {
  // כתובת נקייה בלי פרמטרים: ספקי סליקה מוסיפים פרמטרים משלהם לכתובת החזרה,
  // ושרשור על query קיים יוצר כתובת שבורה. הפורטל ממילא טוען את מצב הפרו
  // מהשרת בכניסה, ולכן אין צורך לסמן "שולם" בכתובת.
  const returnUrl = `${window.location.origin}/supplier/${token}`;
  const { paymentUrl } = await api.post(
    `/api/public/vendors/${token}/pro-checkout`,
    { returnUrl }
  );
  return paymentUrl;
}

/* קטלוג ציבורי לקריאה של ספק (לשיתוף) — בלי פרטי תשלום/כניסה. */
export async function getPublicCatalog(id) {
  return api.get(`/api/public/vendors/catalog/${id}`);
}

/* מדריך הספקים הציבורי (מרקטפלייס) — רשימה קלילה לגלישה/סינון. */
export async function getSupplierDirectory() {
  return api.get("/api/public/vendors/directory");
}

/*
  חילוץ מוצרים מטקסט קטלוג (PDF) בעזרת ה-AI — מחזיר [{ name, description, price }].
  אם ה-AI לא זמין (503) או נכשל, הקורא נופל חזרה לחילוץ המקומי (parsePdfText).
*/
export async function extractProductsFromText(text) {
  const result = await api.post("/api/public/vendors/extract-products", {
    text,
  });
  return (result && result.products) || [];
}

/*
  חילוץ מוצרים מצילום קטלוג — שולח את התמונה (base64) ל-AI שקורא אותה ישירות.
  base64 בלי הקידומת "data:...;base64,". מחזיר [{ name, description, price }].
*/
export async function extractProductsFromImage(imageBase64, imageMimeType) {
  const result = await api.post("/api/public/vendors/extract-products", {
    imageBase64,
    imageMimeType: imageMimeType || "image/jpeg",
  });
  return (result && result.products) || [];
}
