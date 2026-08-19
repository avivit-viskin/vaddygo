/*
  tourBus — אפיק פשוט להפעלת "סיור ההיכרות" (Product Tour) מכל מקום באפליקציה,
  בלי תלות ב-React. כפתור בתפריט הצד או סגירת חלון "ברוכים הבאים" קוראים
  ל-startTour(), ורכיב <Tour /> (שמאזין) פותח את הסיור. אותה תבנית כמו toastBus.
*/
const TOUR_SEEN_KEY = "vaadygo.tourSeen";

let listeners = [];

export function subscribeTour(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

// מפעיל את הסיור בפועל (כל מאזין = רכיב Tour פתוח אחד)
export function startTour() {
  listeners.forEach((listener) => listener());
}

// סימון שהסיור כבר הוצג — כדי לא לפתוח אותו אוטומטית שוב ושוב
export function markTourSeen() {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, "1");
  } catch {
    // אחסון חסום (גלישה פרטית) — לא נורא, פשוט אין זיכרון שהסיור הוצג
  }
}

export function hasTourBeenSeen() {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
