import "../styles/skeleton.css";

/*
  Skeleton — מצב טעינה בצורת התוכן שעומד להגיע, במקום גלגל מסתובב.

  שתי סיבות, ושתיהן מעשיות:

  1. **המסך לא קופץ.** גלגל באמצע מסך ריק תופס גובה אחר מהתוכן, ולכן ברגע
     שהנתונים מגיעים הכול מזנק למקומו. שלד בגודל הנכון מחזיק את המקום —
     זה ההבדל בין "נטען" ל"מוכן".

  2. **🔴 גלגל שמחליף מסך שלם מפרק כל מה שפתוח בתוכו.** ב-30.09 רענון רשימת
     התלמידים החזיר את המסך למצב טעינה, וזה מחק חלון פתוח ואת הודעת האישור
     שבתוכו לפני שאפשר היה לקרוא אותה. שלד שמחליף רק את **אזור התוכן**
     משאיר את מעטפת הדף — והחלונות שבה — במקומם.

  aria-hidden: קורא-מסך אינו צריך לשמוע תיאור של מלבנים אפורים. ההודעה
  הנשמעת היא על המיכל (role="status"), פעם אחת.
*/
export function SkeletonLine({ width = "100%", height = 14 }) {
  return (
    <span
      className="skeleton skeleton--line"
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/* כרטיס ברשימה — שם, שתי שורות פרטים ושורת כפתורים. */
export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-card__head">
        <SkeletonLine width="38%" height={16} />
        <SkeletonLine width="22%" height={20} />
      </div>
      <SkeletonLine width="55%" />
      <SkeletonLine width="42%" />
      <div className="skeleton-card__actions">
        <SkeletonLine width="34%" height={34} />
        <SkeletonLine width="28%" height={34} />
      </div>
    </div>
  );
}

/*
  רשימת כרטיסים. count מכוון למה שבדרך כלל נכנס למסך אחד — יותר מדי שלדים
  נראים כמו תוכן אמיתי ומבלבלים, פחות מדי לא מחזיקים את הגובה.
*/
function Skeleton({ count = 3, label = "טוען..." }) {
  return (
    <div className="skeleton-list" role="status" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
