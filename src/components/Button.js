/*
  Button — כפתור גנרי. variant: primary / secondary / danger.
  isLoading נועל את הכפתור בזמן שליחה (כלל מחייב בטפסים).
*/
function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  isLoading = false,
  onClick,
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}`}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading ? "רק רגע..." : children}
    </button>
  );
}

export default Button;
