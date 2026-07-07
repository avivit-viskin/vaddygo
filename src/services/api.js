/*
  api.js — הקובץ היחיד שמדבר עם השרת. כל קריאת רשת במערכת עוברת דרכו.
  כתובת הבסיס מגיעה ממשתנה הסביבה REACT_APP_API_URL — אין כתובות קשיחות בקוד.
*/

const BASE_URL = process.env.REACT_APP_API_URL;

export class ApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  if (!BASE_URL) {
    throw new ApiError(
      "כתובת השרת לא מוגדרת. יש להגדיר את משתנה הסביבה REACT_APP_API_URL."
    );
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("לא הצלחנו להתחבר לשרת. בדקי שהוא פועל ונסי שוב 🙂");
  }

  if (!response.ok) {
    throw new ApiError("משהו השתבש בשרת. נסי שוב בעוד רגע.", response.status);
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
