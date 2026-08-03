import Icon from "./Icon";
import "../styles/pro.css";

/*
  ProBadge — תגית "פרו" קטנה (כתר זהב) שמוצמדת ליד פיצ'רים ממסלול הפרו.
  שלב א': סימון ויזואלי בלבד — לא חוסם כלום (ראו services/plan.js).
  דקורטיבי (aria-hidden) כדי לא "ללכלך" את השם הנגיש של כפתורים/כותרות שלצידו;
  המידע הנגיש על הפרו נמצא בעמוד השדרוג ובכניסה הייעודית בתפריט הצד.
*/
function ProBadge({ label = "פרו", size = 12, title = "פיצ'ר פרו" }) {
  return (
    <span className="pro-badge" title={title} aria-hidden="true">
      <Icon name="crown" size={size} /> {label}
    </span>
  );
}

export default ProBadge;
