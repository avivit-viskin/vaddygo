import { api } from "./api";

/*
  reviewsService — ביקורות ודירוג של ועדים על ספקים. הקריאה פתוחה (כל אחד רואה
  ביקורות); הכתיבה דורשת ועד מחובר (JWT + המוסד הפעיל נשלח אוטומטית בכותרת
  X-Institution ע"י שכבת ה-api).
*/
export async function getVendorReviews(vendorId) {
  return api.get(`/api/vendors/${vendorId}/reviews`);
}

export async function saveVendorReview(vendorId, { stars, text }) {
  return api.post(`/api/vendors/${vendorId}/reviews`, { stars, text });
}

/* תגובת הספק לביקורת — מאומת מול טוקן העריכה של הספק (token). */
export async function saveReviewReply(token, reviewId, text) {
  return api.post(`/api/public/vendors/${token}/reviews/${reviewId}/reply`, {
    text,
  });
}
