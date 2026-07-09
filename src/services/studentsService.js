/*
  studentsService.js — כל הקריאות שקשורות לתלמידים.
  קומפוננטות לא קוראות ל-api ישירות — רק דרך שכבת ה-service.
*/

import { api } from "./api";

export function getStudents() {
  return api.get("/api/students");
}

export function getStudent(id) {
  return api.get(`/api/students/${id}`);
}

export function createStudent(student) {
  return api.post("/api/students", student);
}

export function updateStudent(id, student) {
  return api.put(`/api/students/${id}`, student);
}

export function deleteStudent(id) {
  return api.del(`/api/students/${id}`);
}
