/*
  toastBus — אפיק הודעות (Toast) פשוט, בלי תלות ב-React.
  מאפשר לשכבת ה-API (קוד שאינו רכיב) להודיע על הצלחת/כשל שמירה מכל מקום,
  ורכיב ה-ToastContainer מאזין ומציג. כך אין צורך לחווט הודעה בכל מסך בנפרד.
*/
let listeners = [];
let counter = 0;

export function subscribeToasts(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function showToast(type, message) {
  counter += 1;
  const toast = { id: counter, type, message };
  listeners.forEach((listener) => listener(toast));
}

export const toastSuccess = (message) => showToast("success", message);
export const toastError = (message) => showToast("error", message);
