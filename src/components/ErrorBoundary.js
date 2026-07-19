import { Component } from "react";
import { reportError } from "../services/errorReporter";

/*
  ErrorBoundary — רשת ביטחון לכל האפליקציה. אם קומפוננטה כלשהי קורסת בזמן ריצה,
  במקום "דף לבן" מוצג מסך ידידותי עם כפתור רענון, והתקלה מדווחת (errorReporter).
  חייב להיות קומפוננטת מחלקה — רק היא יכולה לתפוס שגיאות רינדור ב-React.

  העיצוב כאן ב-inline styles בכוונה: כדי שהמסך ייראה תקין גם אם דווקא טעינת ה-CSS
  היא זו שנכשלה.
*/
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    reportError(error, info);
  }

  handleReload = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div dir="rtl" role="alert" style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.icon} aria-hidden="true">
            😕
          </div>
          <h1 style={styles.title}>אופס, משהו השתבש</h1>
          <p style={styles.text}>
            נתקלנו בתקלה קטנה. אפשר לטעון מחדש ולהמשיך — הנתונים שלך שמורים.
          </p>
          <button type="button" style={styles.btn} onClick={this.handleReload}>
            רענון האתר
          </button>
        </div>
      </div>
    );
  }
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#faf7f6",
    fontFamily:
      '"Rubik", "Heebo", "Assistant", system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  card: {
    maxWidth: "420px",
    width: "100%",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "32px 24px",
    textAlign: "center",
    boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
    border: "1px solid #eee",
  },
  icon: { fontSize: "44px", lineHeight: 1, marginBottom: "12px" },
  title: { margin: "0 0 8px", fontSize: "1.4rem", color: "#2b2430" },
  text: { margin: "0 0 20px", color: "#6b636e", lineHeight: 1.6 },
  btn: {
    border: "none",
    background: "#e5397f",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: 600,
    padding: "12px 28px",
    borderRadius: "999px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

export default ErrorBoundary;
