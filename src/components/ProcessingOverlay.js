import "../styles/processing.css";

/*
  ProcessingOverlay — כיסוי מלא-מסך שמרגיע בזמן פעולה ארוכה (למשל שמירת
  ההרשמה): "המערכת עובדת... אל דאגה, הנתונים שלך שמורים בבטחה".
  מוצג לפי isOpen; אפשר להעביר message מותאם.
*/
function ProcessingOverlay({ isOpen, message }) {
  if (!isOpen) {
    return null;
  }
  return (
    <div className="processing-overlay" role="status" aria-live="polite">
      <div className="processing-overlay__box">
        <div className="spinner" aria-hidden="true" />
        <p className="processing-overlay__title">רק רגע, המערכת עובדת…</p>
        <p className="processing-overlay__note">
          🔒 {message || "אל דאגה — הנתונים שלך שמורים בבטחה."}
        </p>
      </div>
    </div>
  );
}

export default ProcessingOverlay;
