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
  dataTour,
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      data-tour={dataTour || undefined}
    >
      {isLoading ? "רק רגע..." : children}
    </button>
  );
}

export default Button;
