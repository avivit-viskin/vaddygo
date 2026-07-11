import { useEffect, useRef } from "react";
import { GOOGLE_CLIENT_ID } from "../config/google";

/*
  GoogleSignInButton — כפתור "כניסה עם Google" (UI_SPEC ס' 2).
  טוען את ספריית Google Identity Services, מציג את הכפתור הרשמי של גוגל,
  ומעביר את ה-credential (ID token) ל-onCredential. אם אין Client ID
  מוגדר — לא מציג כלום (בטוח לפריסה גם לפני שהחיבור מוכן).
*/
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function GoogleSignInButton({ onCredential, onError }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return undefined;
    }
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !containerRef.current) {
          return;
        }
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => onCredential(response.credential),
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          text: "continue_with",
          shape: "pill",
          locale: "he",
          width: 280,
        });
      })
      .catch(() => onError && onError());

    return () => {
      cancelled = true;
    };
  }, [onCredential, onError]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }
  return <div ref={containerRef} className="google-signin" />;
}

export default GoogleSignInButton;
