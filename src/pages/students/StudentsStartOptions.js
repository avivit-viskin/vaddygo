import Icon from "../../components/Icon";
import Button from "../../components/Button";
import HelpVideoButton from "../../components/HelpVideoButton";
import "../../styles/students-start.css";

/*
  StudentsStartOptions — שתי הדרכים להזין תלמידים, מוצגות במסך הריק.

  🔴 למה זה נבנה: בסטטוס ההקמה נראה שהרבה ועדים פותחים גן ואף פעם לא מזינים
  תלמידים. שתי האפשרויות היו קיימות כל הזמן — אבל כשורה של חמישה כפתורים
  אפורים בראש המסך, בין "ייצוא לאקסל" ל"בקשת תשלום בוואטסאפ". מי שלא ידעה מה
  היא מחפשת לא ראתה אותן.

  שלוש החלטות:

  1. **שתי אפשרויות, לא כפתור אחד.** מי שיש לה רשימה מהגננת לא צריכה להקליד
     שלושים ילדים, ומי שאין לה לא צריכה לחפש קובץ. הצגת שתיהן יחד הופכת את
     הבחירה לברורה במקום להסתיר את הדרך המהירה.

  2. **קובץ משרד החינוך נאמר במפורש.** זה הקובץ שכבר נמצא ביד של מנהלת המוסד,
     והמערכת יודעת לקרוא אותו — אבל אף אחד לא מנחש את זה לבד. בקשת בעלת
     המוצר 14.09.2026.

  3. **הסרטון אחרון וכקישור.** הוא עוזר למי שנתקעה, אבל הוא לא הפעולה — ואסור
     לו להתחרות בשתי האפשרויות האמיתיות.
*/
function StudentsStartOptions({ onAddOne, onImport }) {
  return (
    <div className="students-start">
      <p className="students-start__lead">
        יש שתי דרכים להתחיל — אפשר לבחור כל אחת מהן:
      </p>

      <div className="students-start__options">
        <div className="students-start__option">
          <span className="students-start__icon" aria-hidden="true">
            <Icon name="plus" size={22} />
          </span>
          <h3 className="students-start__title">להוסיף ילד אחד</h3>
          <p className="students-start__text">
            שם הילד, שם ההורה וטלפון — וזהו. אפשר להוסיף עוד מתי שרוצים.
          </p>
          <Button variant="brand" onClick={onAddOne}>
            הוספת תלמיד
          </Button>
        </div>

        <div className="students-start__option">
          <span className="students-start__icon" aria-hidden="true">
            <Icon name="folder" size={22} />
          </span>
          <h3 className="students-start__title">להעלות קובץ עם כל הרשימה</h3>
          <p className="students-start__text">
            יש לך רשימה מוכנה? אפשר להעלות <strong>את הקובץ שקיבלת ממשרד
            החינוך</strong> כמו שהוא, או כל קובץ אקסל — והמערכת תוסיף את כולם
            בבת אחת.
          </p>
          <Button variant="secondary" onClick={onImport}>
            ייבוא מקובץ
          </Button>
        </div>
      </div>

      <div className="students-start__video">
        <HelpVideoButton label="לראות איך זה נראה (סרטון קצר)" />
      </div>
    </div>
  );
}

export default StudentsStartOptions;
