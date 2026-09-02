import { api } from "./api";
import { getActiveInstitution } from "./institutionsService";

/*
  leadsService — "בקשת הצעת מחיר" (RFQ) בין ועד לספק.
  • createLead: הוועד שולח בקשה לספק (נוחתת בתיבת הפניות שלו).
  • getSupplierLeads: הספק קורא את התיבה שלו לפי טוקן העריכה.
  • updateLeadStatus: הספק מעדכן סטטוס פנייה (new/quoted/won/closed).
*/
export function createLead(vendorId, rfq) {
  return api.post(`/api/public/vendors/${vendorId}/lead`, rfq);
}

/*
  רישום יצירת-קשר של ועד עם ספק בלחיצה על וואטסאפ (בלי טופס מלא) — שומר פנייה
  קלה עם שם הגן, כדי שהמנהלת תראה מי פנה לספק גם דרך וואטסאפ. fire-and-forget.
  אם אין גן פעיל (למשל בצד הספק עצמו) — לא נרשם כלום.
*/
export function recordVendorContact(vendorId) {
  const name = getActiveInstitution()?.name;
  if (!vendorId || !name) {
    return Promise.resolve();
  }
  // keepalive: הבקשה חייבת להסתיים גם כשהלחיצה מנווטת מיד לוואטסאפ (בעיקר בנייד).
  // silent: בקשת-רקע — בלי הודעת "נשמר" שתבלבל את מי שרק פנה לספק.
  return api
    .post(
      `/api/public/vendors/${vendorId}/lead`,
      { committeeName: name, subject: "יצירת קשר בוואטסאפ" },
      { keepalive: true, silent: true }
    )
    .catch(() => {});
}

export function getSupplierLeads(token) {
  return api.get(`/api/public/vendors/${token}/leads`);
}

export function updateLeadStatus(token, leadId, status) {
  return api.put(`/api/public/vendors/${token}/leads/${leadId}/status`, {
    status,
  });
}
