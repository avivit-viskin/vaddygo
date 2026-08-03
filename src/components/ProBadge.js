import Icon from "./Icon";
import "../styles/pro.css";

/*
  ProBadge — תגית "פרו" בסגנון Canva: כתר זהב מלא בתוך קובייה קטנה מעוגלת,
  בלי טקסט. שלב א': סימון ויזואלי בלבד — לא חוסם כלום (ראו services/plan.js).
  דקורטיבי (aria-hidden) כדי לא "ללכלך" את השם הנגיש של כפתורים/כותרות שלצידו;
  ה-title משמש כ-tooltip למי שמרחף עם העכבר.
*/
function ProBadge({ size = 16, title = "פרו" }) {
  return (
    <span className="pro-badge" title={title} aria-hidden="true">
      <Icon name="crown" size={size} />
    </span>
  );
}

export default ProBadge;
