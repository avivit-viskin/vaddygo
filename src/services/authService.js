import { api } from "./api";

/*
  authService — הזדהות המנוי (UI_SPEC ס' 2): הרשמה בעת הרכישה (שם משתמש +
  סיסמה) וכניסה חוזרת. שומר את ה-JWT ופרטי המנוי ב-localStorage; ‏api.js
  מצרף את ה-token לכל בקשה. תוקף המנוי (עד 30.8 של השנה שאחרי) נאכף בשרת.
*/
export const TOKEN_KEY = "vaadygo.token";
const USER_KEY = "vaadygo.user";
// מי הבעלים של הנתונים המקומיים במכשיר — לזיהוי החלפת משתמש
const DATA_OWNER_KEY = "vaadygo.dataOwner";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

/* האם המשתמשת היא מנהלת-על (לניהול ספקים — UI_SPEC ס' 12) */
export function isSuperAdmin() {
  return getUser()?.role === "SuperAdmin";
}

/*
  מנקה את כל הנתונים המקומיים שקשורים למשתמש/מוסד (מוסדות, אשף, צוות, אירועים,
  מתנות, תקציבים, התראות שנקראו, הגדרות) — כל מפתחות vaadygo.* חוץ מפרטי ההזדהות.
*/
function clearCachedAppData() {
  const keep = new Set([TOKEN_KEY, USER_KEY, DATA_OWNER_KEY]);
  Object.keys(localStorage)
    .filter((key) => key.startsWith("vaadygo.") && !keep.has(key))
    .forEach((key) => localStorage.removeItem(key));
}

function store(auth) {
  // אבטחה: אם מתחבר משתמש *אחר* מזה שהנתונים המקומיים שייכים לו (אותו מכשיר) —
  // מנקים את כל המטמון המקומי כדי שלא יראה מוסדות/צוות של משתמש קודם.
  // כניסה חוזרת של אותו משתמש שומרת את הנתונים שלו.
  if (localStorage.getItem(DATA_OWNER_KEY) !== auth.username) {
    clearCachedAppData();
  }
  localStorage.setItem(DATA_OWNER_KEY, auth.username);
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      username: auth.username,
      email: auth.email,
      role: auth.role,
      subscriptionValidUntil: auth.subscriptionValidUntil,
    })
  );
}

export async function register({ username, email, password }) {
  const auth = await api.post("/api/auth/register", { username, email, password });
  store(auth);
  return auth;
}

export async function login({ usernameOrEmail, password }) {
  const auth = await api.post("/api/auth/login", { usernameOrEmail, password });
  store(auth);
  return auth;
}

/* כניסה/הרשמה עם Google — שולח לשרת את ה-credential שהתקבל מכפתור גוגל */
export async function loginWithGoogle(credential) {
  const auth = await api.post("/api/auth/google", { credential });
  store(auth);
  return auth;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/* שינוי סיסמה למשתמשת המחוברת (משימה: הגדרות → שינוי סיסמה). */
export function changePassword({ currentPassword, newPassword }) {
  return api.post("/api/auth/change-password", { currentPassword, newPassword });
}
