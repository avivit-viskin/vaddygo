import Icon from "./Icon";
import { isPro as isCommitteePro } from "../services/plan";
import "../styles/pro.css";

/*
  ProBadge — כתר זהב קטן שמסמן "פיצ'ר של מסלול פרו".

  כלל התצוגה (החלטת בעלת המוצר, 10.08.2026): הכתר הוא **סימן שהפיצ'ר עדיין
  לא נרכש** — ולכן הוא נעלם מעצמו ברגע שהמסלול נרכש. אין צורך לעטוף כל שימוש
  בתנאי; הרכיב בודק בעצמו.

  ברירת המחדל נבדקת מול המוסד הפעיל (צד הוועד). בצד הספק אין "מוסד", ולכן שם
  מעבירים במפורש isPro={vendor?.isPro}.

  דקורטיבי (aria-hidden) כדי לא "ללכלך" את השם הנגיש של הכפתור שלצידו;
  ה-title משמש כ-tooltip.
*/
function ProBadge({ size = 16, title = "פרו", isPro }) {
  const purchased = isPro === undefined ? isCommitteePro() : Boolean(isPro);
  if (purchased) {
    return null;
  }
  return (
    <span className="pro-badge" title={title} aria-hidden="true">
      <Icon name="crown" size={size} />
    </span>
  );
}

export default ProBadge;
