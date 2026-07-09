/*
  api.js — הקובץ היחיד שמדבר עם השרת. כל קריאת רשת במערכת עוברת דרכו.
  כתובת הבסיס מגיעה ממשתנה הסביבה REACT_APP_API_URL — אין כתובות קשיחות בקוד.
*/

const BASE_URL = process.env.REACT_APP_API_URL;

// מפתח ה-token מוגדר גם ב-authService; נקרא כאן ישירות מ-localStorage
// כדי להימנע מתלות מעגלית (authService מייבא את api).
const TOKEN_KEY = "vaadygo.token";

export class ApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/*
  מחלץ הודעת שגיאה ידידותית שהשרת שלח (message או שגיאת ולידציה ראשונה);
  אם אין — חוזרים להודעה כללית.
*/
async function extractErrorMessage(response) {
  const fallback = "משהו השתבש בשרת. נסי שוב בעוד רגע.";
  try {
    const body = await response.json();
    if (body && typeof body.message === "string") {
      return body.message;
    }
    if (body && body.errors) {
      const firstError = Object.values(body.errors).flat()[0];
      if (typeof firstError === "string") {
        return firstError;
      }
    }
  } catch {
    // הגוף אינו JSON — נשארים עם ההודעה הכללית
  }
  return fallback;
}

async function request(path, { method = "GET", body } = {}) {
  if (!BASE_URL) {
    throw new ApiError(
      "כתובת השרת לא מוגדרת. יש להגדיר את משתנה הסביבה REACT_APP_API_URL."
    );
  }

  const headers = {};
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: Object.keys(headers).length ? headers : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("לא הצלחנו להתחבר לשרת. בדקי שהוא פועל ונסי שוב 🙂");
  }

  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
};
