import { Link } from "react-router-dom";
import BrandName from "../../components/BrandName";
import "../../styles/legal.css";

/*
  LegalLayout — מסגרת משותפת לעמודים המשפטיים (פרטיות / תנאים / נגישות / עוגיות).
  עמוד עצמאי במסך מלא (בלי ניווט תחתון), עם מותג, כותרת, תאריך עדכון וקישור חזרה.
  התוכן הוא נוסח התחלתי — יש להשלים פרטים בסוגריים המרובעים ולהעביר לאישור עו"ד.
*/
function LegalLayout({ title, updated, children }) {
  return (
    <div className="legal-page" dir="rtl">
      <div className="legal-page__bar">
        <Link to="/" className="legal-page__brand" aria-label="חזרה לדף הבית">
          <BrandName />
        </Link>
        <Link to="/" className="legal-page__back">
          חזרה →
        </Link>
      </div>

      <main className="legal-page__content">
        <h1 className="legal-page__title">{title}</h1>
        {updated && (
          <p className="legal-page__updated">עודכן לאחרונה: {updated}</p>
        )}
        <div className="legal-page__body">{children}</div>
      </main>
    </div>
  );
}

export default LegalLayout;
