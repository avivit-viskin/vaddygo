import { Link } from "react-router-dom";

/*
  AiFab — כפתור צף לפתיחת עוזרת ה-AI (UI_SPEC ס' 10), מעל הניווט התחתון.
*/
function AiFab() {
  return (
    <Link to="/assistant" className="ai-fab" aria-label="עוזרת AI">
      <span className="ai-fab__icon" aria-hidden="true">
        💬
      </span>
    </Link>
  );
}

export default AiFab;
