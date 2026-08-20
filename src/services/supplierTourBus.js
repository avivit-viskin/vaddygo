/*
  supplierTourBus — אפיק להפעלת סיור ההיכרות של *הספק* (פורטל הספקים).
  נפרד מ-tourBus של הוועד, כדי שרכיב הסיור הגלובלי של הוועד לא יגיב בטעות
  להפעלה בצד הספק (וההפך). אותה תבנית כמו toastBus/tourBus.
*/
const SUPPLIER_TOUR_SEEN_KEY = "vaadygo.supplierTourSeen";

let listeners = [];

export function subscribeSupplierTour(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function startSupplierTour() {
  listeners.forEach((listener) => listener());
}

export function markSupplierTourSeen() {
  try {
    localStorage.setItem(SUPPLIER_TOUR_SEEN_KEY, "1");
  } catch {
    // אחסון חסום — פשוט לא זוכרים שהסיור הוצג
  }
}

export function hasSupplierTourBeenSeen() {
  try {
    return localStorage.getItem(SUPPLIER_TOUR_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
