/*
  Button — כפתור גנרי.

  variant: primary / brand / secondary / danger (המשמעויות נקבעו ע"י בעלת
  המוצר ב-20.07.2026 — ראו theme.css).

  size: md (ברירת מחדל) / sm.

  🔴 למה נוסף הגודל: מערכת שבה **לכל** הכפתורים אותו משקל היא מערכת בלי
  היררכיה — במסך התלמידים "הוספת תלמיד" צעק בדיוק כמו "ייצוא לאקסל". הגודל
  הוא הממד שמאפשר פעולה ראשית אחת בולטת ושאר הפעולות זמינות אך שקטות, בלי
  לשנות אף אחת מהמשמעויות הקיימות.

  isLoading נועל את הכפתור בזמן שליחה (כלל מחייב בטפסים).
*/
function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  isLoading = false,
  onClick,
  dataTour,
  title,
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}${size === "sm" ? " btn--sm" : ""}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      data-tour={dataTour || undefined}
      title={title || undefined}
    >
      {isLoading ? "רק רגע..." : children}
    </button>
  );
}

export default Button;
