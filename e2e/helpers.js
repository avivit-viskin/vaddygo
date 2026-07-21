/*
  עזרי בוט — פעולות דרך ה-API של השרת, לניקוי/הכנה של חשבון-הבדיקה לפני זרימות UI,
  כדי שהבדיקות יהיו חוזרות (idempotent) ולא יצטברו נתונים בין ריצות.
  כל הפעולות רק על חשבון-הבדיקה (מאובטח לפי הטוקן שלו).
*/
const API_URL =
  process.env.E2E_API_URL || "https://soothing-clarity-production.up.railway.app";

async function apiToken(request) {
  const res = await request.post(`${API_URL}/api/auth/login`, {
    data: {
      usernameOrEmail: process.env.E2E_USER,
      password: process.env.E2E_PASSWORD,
    },
  });
  if (!res.ok()) throw new Error("apiToken: login נכשל");
  return (await res.json()).token;
}

/* מוחק את כל התלמידים של חשבון-הבדיקה — נקודת התחלה נקייה לזרימות. */
async function deleteAllStudents(request) {
  const token = await apiToken(request);
  const headers = { Authorization: `Bearer ${token}` };
  const res = await request.get(`${API_URL}/api/students`, { headers });
  const students = res.ok() ? await res.json() : [];
  for (const s of students) {
    await request.delete(`${API_URL}/api/students/${s.id}`, { headers });
  }
  return students.length;
}

/* סוגר את באנר העוגיות אם הופיע (מקבל) — אחרת הוא חוסם לחיצות באתר. */
async function acceptCookies(page) {
  await page
    .locator(".cookie-consent__btn--accept")
    .click({ timeout: 3000 })
    .catch(() => {});
}

module.exports = { API_URL, apiToken, deleteAllStudents, acceptCookies };
