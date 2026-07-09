import { useNavigate } from "react-router-dom";
import {
  getInstitutions,
  getActiveInstitution,
  setActiveInstitution,
} from "../services/institutionsService";

/*
  InstitutionSwitcher — רשימת המוסדות של המשתמשת + מעבר ביניהם (UI_SPEC ס' 3.5).
  מוסד פעיל מסומן; מעבר למוסד מופעל טוען את נתוניו (רענון). מוסד לא-מופעל
  ("🔒 להפעלה") מוביל למסך הרכישה הזמני.
*/
function InstitutionSwitcher({ onClose }) {
  const navigate = useNavigate();
  const institutions = getInstitutions();
  const active = getActiveInstitution();

  if (institutions.length === 0) {
    return <p className="institutions__empty">עדיין אין מוסדות — נגדיר באשף ההרשמה.</p>;
  }

  function handleClick(institution) {
    if (institution.id === active?.id) {
      onClose?.();
      return;
    }
    if (institution.activated) {
      setActiveInstitution(institution.id);
      // רענון מלא כדי שכל המסכים ייטענו עם נתוני המוסד הפעיל החדש
      window.location.href = "/";
    } else {
      onClose?.();
      navigate(`/institutions/${institution.id}/purchase`);
    }
  }

  return (
    <ul className="institutions">
      {institutions.map((institution) => (
        <li key={institution.id}>
          <button
            type="button"
            className={`institutions__item${
              institution.id === active?.id ? " institutions__item--active" : ""
            }`}
            onClick={() => handleClick(institution)}
          >
            <span className="institutions__name">🏫 {institution.name}</span>
            {institution.id === active?.id ? (
              <span className="institutions__badge">פעיל</span>
            ) : !institution.activated ? (
              <span className="institutions__badge institutions__badge--locked">
                🔒 להפעלה
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default InstitutionSwitcher;
