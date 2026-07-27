import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Logo from "./Logo";
import "../styles/page-transition.css";

/*
  PageTransition — מסך טעינה קצר עם הלוגו בכל מעבר בין עמודים (לבקשת בעלת
  המוצר). מנטר את הנתיב (location.pathname); בכל שינוי נתיב מציג שכבה מלאה
  עם הלוגו (נשימה עדינה + טבעת טעינה) שנעלמת לבד אחרי כ-600ms.
  לא מוצג בטעינה הראשונה, ולא במסכי מסך-מלא (כניסה/הרשמה/אשף) שיש להם אנימציה
  משלהם — נשלט דרך disabled מה-App. מכבד prefers-reduced-motion.
*/
const DURATION = 600;

function PageTransition({ disabled = false }) {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    // דילוג על הטעינה הראשונה — רק מעבר בין עמודים מפעיל את הלוגו
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }
    if (disabled) {
      setVisible(false);
      return undefined;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), DURATION);
    return () => clearTimeout(timer);
  }, [location.pathname, disabled]);

  if (!visible) {
    return null;
  }

  return (
    // key לפי הנתיב — כדי שכל מעבר יריץ מחדש את האנימציה גם במעברים מהירים
    <div className="page-transition" aria-hidden="true" key={location.pathname}>
      <div className="page-transition__stage">
        <span className="page-transition__ring" />
        <div className="page-transition__logo">
          <Logo />
        </div>
      </div>
    </div>
  );
}

export default PageTransition;
