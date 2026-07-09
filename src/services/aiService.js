import { api } from "./api";

/*
  aiService.js — פנייה לעוזרת ה-AI בשרת.
  context הוא רקע כללי לא-מזהה (אופציונלי) — לעולם לא שולחים דרכו שמות/טלפונים.
*/
export function askAssistant(question, context) {
  return api.post("/api/ai/ask", { question, context: context || "" });
}
