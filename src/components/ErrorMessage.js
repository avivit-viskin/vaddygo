import Button from "./Button";

/*
  ErrorMessage — מצב שגיאה ידידותי בעברית, עם כפתור "נסי שוב" אם התקבלה onRetry.
*/
function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-message" role="alert">
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          נסי שוב
        </Button>
      )}
    </div>
  );
}

export default ErrorMessage;
