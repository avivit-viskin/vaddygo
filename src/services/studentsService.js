/*
  studentsService.js — כל הקריאות שקשורות לתלמידים.
  קומפוננטות לא קוראות ל-api ישירות — רק דרך שכבת ה-service.
*/

import { api } from "./api";

export function getStudents() {
  return api.get("/api/students");
}
