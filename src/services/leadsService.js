import { api } from "./api";

/*
  leadsService — "בקשת הצעת מחיר" (RFQ) בין ועד לספק.
  • createLead: הוועד שולח בקשה לספק (נוחתת בתיבת הפניות שלו).
  • getSupplierLeads: הספק קורא את התיבה שלו לפי טוקן העריכה.
  • updateLeadStatus: הספק מעדכן סטטוס פנייה (new/quoted/won/closed).
*/
export function createLead(vendorId, rfq) {
  return api.post(`/api/public/vendors/${vendorId}/lead`, rfq);
}

export function getSupplierLeads(token) {
  return api.get(`/api/public/vendors/${token}/leads`);
}

export function updateLeadStatus(token, leadId, status) {
  return api.put(`/api/public/vendors/${token}/leads/${leadId}/status`, {
    status,
  });
}
