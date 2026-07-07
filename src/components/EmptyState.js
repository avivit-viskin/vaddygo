/*
  EmptyState — מצב ריק ידידותי: אייקון, הודעה, ומקום לפעולה (למשל כפתור הוספה).
*/
function EmptyState({ icon = "🌸", message, children }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        {icon}
      </div>
      <p className="empty-state__message">{message}</p>
      {children}
    </div>
  );
}

export default EmptyState;
