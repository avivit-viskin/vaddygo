/*
  api.js — הקובץ היחיד שמדבר עם השרת. כל קריאת רשת במערכת עוברת דרכו.
  כתובת הבסיס מגיעה ממשתנה הסביבה REACT_APP_API_URL — אין כתובות קשיחות בקוד.
*/

import { getActiveServerGroupId } from "./institutionsService";
import { toastSuccess, toastError } from "./toastBus";

const BASE_URL = process.env.REACT_APP_API_URL;

// פעולות שמירה (מוטציות) — עליהן מציגים "השינויים נשמרו ✓" בהצלחה
const SAVE_METHODS = new Set(["POST", "PUT", "DELETE"]);
// נתיבים שאינם "שמירה" של הלקוח — התחברות ועוזרת AI: בלי הודעת "נשמר"
const NO_TOAST_PREFIXES = ["/api/auth", "/api/ai"];
// נתיבים ללא נפילה ל-localStorage — כאן כישלון שרת = הנתונים באמת לא נשמרו,
// ולכן רק עליהם מציגים "שגיאה, לא נשמר" (בשאר, כישלון נשמר מקומית = לא שגיאה).
const HARD_SAVE_PREFIXES = ["/api/students", "/api/expenses", "/api/payments"];

function isSaveRequest(method, path) {
  return (
    SAVE_METHODS.has(method) &&
    !NO_TOAST_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

function isHardSaveRequest(method, path) {
  return (
    SAVE_METHODS.has(method) &&
    HARD_SAVE_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

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
  const fallback = "משהו השתבש בשרת. אפשר לנסות שוב בעוד רגע.";
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
  // המוסד הפעיל — לסינון הנתונים בשרת לפי מוסד (ריבוי מוסדות)
  const institutionId = getActiveServerGroupId();
  if (institutionId != null) {
    headers["X-Institution"] = String(institutionId);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: Object.keys(headers).length ? headers : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // כשל רשת: רק בנתיבים ללא גיבוי מקומי זו "לא נשמר" אמיתי (בשאר נשמר מקומית)
    if (isHardSaveRequest(method, path)) {
      toastError("אירעה שגיאה — הנתונים האחרונים לא נשמרו. אפשר לנסות שוב 🙏");
    }
    throw new ApiError("לא הצלחנו להתחבר לשרת. כדאי לבדוק שהוא פועל ולנסות שוב 🙂");
  }

  if (!response.ok) {
    if (isHardSaveRequest(method, path)) {
      toastError("אירעה שגיאה — הנתונים האחרונים לא נשמרו. אפשר לנסות שוב 🙏");
    }
    throw new ApiError(await extractErrorMessage(response), response.status);
  }

  // הצלחת שמירה בשרת — משוב "נשמר" (הודעות זהות מתאחדות ב-ToastContainer)
  if (isSaveRequest(method, path)) {
    toastSuccess("השינויים נשמרו בהצלחה");
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
