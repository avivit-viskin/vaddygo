/*
  ProgressRing — טבעת התקדמות עגולה (SVG) לאחוזים. משמשת את הספק לראות "כמה
  הכרטיס שלי מוכן" במבט אחד (גיימיפיקציה קלה). הצבע עובר מוורוד המותג לירוק
  כשמגיעים ל-100%. האחוז מוצג במרכז. נגיש: role=img עם aria-label בעברית.
*/
function ProgressRing({ percent = 0, size = 64, stroke = 7, children }) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  const done = pct === 100;
  const color = done ? "var(--color-success)" : "var(--color-primary-muted)";

  return (
    <span
      className="progress-ring"
      role="img"
      aria-label={`הכרטיס מוכן ב-${pct} אחוז`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
        />
      </svg>
      <span className="progress-ring__center">
        {children ?? <span className="progress-ring__pct">{pct}%</span>}
      </span>
    </span>
  );
}

export default ProgressRing;
