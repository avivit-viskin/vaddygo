import { useState } from "react";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import {
  isPro,
  grantProLocally,
  revokeProLocally,
  canUnlockProWithoutPaying,
} from "../../services/plan";
import { getActiveInstitution } from "../../services/institutionsService";
import "../../styles/pro-test.css";

/*
  ProTestControl — מתג פרו לבדיקות, למנהלת VaddyGo בלבד.

  למה זה קיים: עד היום הדרך היחידה לפתוח פרו הייתה להקליד ידנית את כתובת מסך
  התשלום ולהזין שם קוד במקום מספר כרטיס. הכפתור היחיד שכן מוצג בממשק ("מעבר
  לתשלום מאובטח") מוביל לעמוד סליקה **אמיתי** — כלומר בדיקה של פרו עלולה
  להסתיים בחיוב אמיתי. המתג הזה נותן דרך בטוחה ומפורשת.

  שני גבולות חשובים, והם בדיוק מה שהופך את זה לבטוח:
  • **רק המוסד הפעיל** — פרו הוא לכל מוסד בנפרד (ראו plan.js), ולכן פתיחה כאן
    לא נוגעת בשאר המוסדות. שם המוסד מוצג במפורש כדי שלא תהיה טעות.
  • **רק הדפדפן הזה** — הפתיחה נשמרת מקומית ואינה נשלחת לשרת, ולכן אף לקוח
    אחר אינו מושפע.
*/
function ProTestControl() {
  const [unlocked, setUnlocked] = useState(() => isPro());
  const institution = getActiveInstitution();
  const name = institution?.name || "המוסד הפעיל";

  // שכבת הגנה שנייה: העמוד כולו כבר חסום למי שאינה מנהלת, אבל הרכיב בודק גם
  // בעצמו — כדי שהעברה שלו למסך אחר בעתיד לא תחשוף בטעות פתיחת פרו חינם.
  if (!canUnlockProWithoutPaying()) {
    return null;
  }

  function toggle() {
    if (unlocked) {
      revokeProLocally();
    } else {
      grantProLocally();
    }
    setUnlocked(isPro());
  }

  return (
    <section className="pro-test">
      <h3 className="pro-test__title">
        <Icon name="crown" size={18} /> מצב פרו — לבדיקות
      </h3>

      <p className="pro-test__target">
        המוסד הפעיל: <strong>{name}</strong>
        <span
          className={`pro-test__pill${unlocked ? " pro-test__pill--on" : ""}`}
        >
          {unlocked ? "פרו פתוח" : "פרו נעול"}
        </span>
      </p>

      <div className="pro-test__actions">
        <Button variant={unlocked ? "secondary" : "primary"} onClick={toggle}>
          {unlocked ? "נעילת פרו במוסד הזה" : "פתיחת פרו במוסד הזה"}
        </Button>
      </div>

      <p className="pro-test__note">
        פותח ונועל רק את <strong>{name}</strong>, ורק בדפדפן הזה — בלי חיוב, בלי
        לשלוח שום דבר לשרת, ובלי להשפיע על מוסדות אחרים או על לקוחות. כדי לבדוק
        מוסד אחר — יש להחליף אליו קודם בתפריט "המוסדות שלי".
      </p>
    </section>
  );
}

export default ProTestControl;
