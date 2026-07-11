/*
  google.js — ה-Client ID של Google OAuth (כניסה עם Google, UI_SPEC ס' 2).
  זהו מזהה ציבורי (לא סוד) ולכן מופיע כאן כברירת מחדל; אפשר לדרוס דרך
  משתנה הסביבה REACT_APP_GOOGLE_CLIENT_ID.
*/
export const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "181059185447-cel67c38gsl9ij46u5vjiuqa2h7mcp2l.apps.googleusercontent.com";
