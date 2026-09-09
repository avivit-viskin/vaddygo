import { Link } from "react-router-dom";
import InstallAppButton from "./InstallAppButton";
import "../styles/footer.css";

/*
  Footer — כפתור "הורידו את האפליקציה" + קישורים לעמודים המשפטיים בתחתית התוכן
  (מעל הניווט התחתון). מוצג בכל מסך פנימי; העמודים עצמם ציבוריים.
*/
function Footer() {
  return (
    <footer className="app-footer">
      <InstallAppButton />
      <nav className="app-footer__links" aria-label="קישורים משפטיים">
        <Link to="/privacy">מדיניות פרטיות</Link>
        <span aria-hidden="true">·</span>
        <Link to="/terms">תנאי שימוש</Link>
        <span aria-hidden="true">·</span>
        <Link to="/accessibility">נגישות</Link>
        <span aria-hidden="true">·</span>
        <Link to="/cookies">עוגיות</Link>
      </nav>
      <nav className="app-footer__links" aria-label="ספקים">
        <Link to="/supplier-login">🏷️ כניסת ספקים</Link>
        <span aria-hidden="true">·</span>
        <Link to="/directory">מדריך הספקים</Link>
      </nav>
      <p className="app-footer__copy">© VaddyGo</p>
    </footer>
  );
}

export default Footer;
