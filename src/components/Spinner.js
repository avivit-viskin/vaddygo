/*
  Spinner — מצב טעינה אחיד לכל המסכים.
*/
function Spinner({ text = "טוען..." }) {
  return (
    <div className="spinner-container" role="status">
      <div className="spinner" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

export default Spinner;
