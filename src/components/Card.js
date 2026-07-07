/*
  Card — כרטיס תוכן גנרי עם כותרת אופציונלית. משמש כמשטח הבסיסי בכל המסכים.
*/
function Card({ title, children }) {
  return (
    <div className="card">
      {title && <div className="card__title">{title}</div>}
      {children}
    </div>
  );
}

export default Card;
