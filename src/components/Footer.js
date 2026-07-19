import { Link } from "react-router-dom";

/*
  Footer — קישורים לעמודים המשפטיים בתחתית התוכן (מעל הניווט התחתון).
  מוצג בכל מסך פנימי; העמודים עצמם ציבוריים (אפשר לצפות גם בלי התחברות).
*/
function Footer() {
  return (
    <footer className="app-footer">
      <nav className="app-footer__links" aria-label="קישורים משפטיים">
        <Link to="/privacy">מדיניות פרטיות</Link>
        <span aria-hidden="true">·</span>
        <Link to="/terms">תנאי שימוש</Link>
        <span aria-hidden="true">·</span>
        <Link to="/accessibility">נגישות</Link>
        <span aria-hidden="true">·</span>
        <Link to="/cookies">עוגיות</Link>
      </nav>
      <p className="app-footer__copy">© VaddyGo</p>
    </footer>
  );
}

export default Footer;
