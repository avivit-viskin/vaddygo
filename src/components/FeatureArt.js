/*
  FeatureArt — איורים וקטוריים (SVG) לכרטיסי היכולות בדף הנחיתה. כל פיצ'ר עם
  סצנה צבעונית משלו (מטבעות, ילדים, לוח שנה, מתנה, תיקייה, מגן) — חד בכל גודל,
  צבעוני וידידותי, בשפה של VaddyGo. נטען רק בדף הנחיתה.
*/

const ART = {
  // גבייה ותשלומים — ערמת מטבעות + מטבע ₪
  collect: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <circle cx="48" cy="48" r="42" fill="#ffe6ef" />
      <ellipse cx="38" cy="67" rx="19" ry="6.5" fill="#e2a02c" />
      <rect x="19" y="56" width="38" height="11" fill="#f5c451" />
      <ellipse cx="38" cy="56" rx="19" ry="6.5" fill="#ffd873" />
      <ellipse cx="38" cy="49" rx="19" ry="6.5" fill="#e2a02c" />
      <rect x="19" y="42" width="38" height="7" fill="#f5c451" />
      <ellipse cx="38" cy="42" rx="19" ry="6.5" fill="#ffd873" />
      <circle cx="62" cy="42" r="17" fill="#f5c451" stroke="#e2a02c" strokeWidth="2.5" />
      <circle cx="62" cy="42" r="12" fill="#ffd873" />
      <text x="62" y="48" fontSize="16" fontWeight="800" textAnchor="middle" fill="#bf821c" fontFamily="Rubik, sans-serif">₪</text>
    </svg>
  ),
  // תלמידים והורים — קבוצת אנשים
  students: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <circle cx="48" cy="48" r="42" fill="#ffe9dd" />
      <circle cx="29" cy="43" r="9" fill="#7ec8f0" />
      <path d="M15 67c0-8 6.3-13 14-13s14 5 14 13z" fill="#7ec8f0" />
      <circle cx="67" cy="43" r="9" fill="#ffbf6b" />
      <path d="M53 67c0-8 6.3-13 14-13s14 5 14 13z" fill="#ffbf6b" />
      <circle cx="48" cy="38" r="11" fill="#f4739e" />
      <path d="M31 69c0-9.4 7.6-16 17-16s17 6.6 17 16z" fill="#f4739e" />
    </svg>
  ),
  // לוח שנה ואירועים
  calendar: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <circle cx="48" cy="48" r="42" fill="#e3f1fc" />
      <rect x="24" y="31" width="48" height="41" rx="7" fill="#ffffff" stroke="#cfe6f7" strokeWidth="2" />
      <path d="M24 38a7 7 0 0 1 7-7h34a7 7 0 0 1 7 7v5H24z" fill="#4a9fe0" />
      <rect x="33" y="25" width="4" height="12" rx="2" fill="#2f7fc0" />
      <rect x="59" y="25" width="4" height="12" rx="2" fill="#2f7fc0" />
      <circle cx="36" cy="53" r="3" fill="#cfe6f7" />
      <circle cx="48" cy="53" r="3.6" fill="#ff6b8a" />
      <circle cx="60" cy="53" r="3" fill="#cfe6f7" />
      <circle cx="36" cy="63" r="3" fill="#cfe6f7" />
      <circle cx="48" cy="63" r="3" fill="#cfe6f7" />
      <circle cx="60" cy="63" r="3" fill="#cfe6f7" />
      <path d="M72 25l1.7 3.5 3.8.6-2.8 2.7.7 3.9L72 34l-3.4 1.8.7-3.9-2.8-2.7 3.8-.6z" fill="#ffcf5b" />
    </svg>
  ),
  // מתנות וספקים
  gifts: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <circle cx="48" cy="48" r="42" fill="#f0e6fc" />
      <rect x="27" y="45" width="42" height="25" rx="4" fill="#f4739e" />
      <rect x="24" y="37" width="48" height="12" rx="4" fill="#ff92b3" />
      <rect x="44" y="37" width="8" height="33" fill="#ffcf5b" />
      <circle cx="43" cy="34" r="5" fill="#ffcf5b" />
      <circle cx="53" cy="34" r="5" fill="#ffcf5b" />
      <circle cx="48" cy="36" r="3" fill="#e2a02c" />
      <path d="M71 29l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4z" fill="#a06fe0" />
    </svg>
  ),
  // קבצים ומסמכים
  files: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <circle cx="48" cy="48" r="42" fill="#dff5ef" />
      <rect x="37" y="29" width="27" height="34" rx="3" fill="#ffffff" stroke="#bfe6da" strokeWidth="2" />
      <rect x="43" y="37" width="15" height="3" rx="1.5" fill="#cfeae2" />
      <rect x="43" y="44" width="15" height="3" rx="1.5" fill="#cfeae2" />
      <rect x="43" y="51" width="10" height="3" rx="1.5" fill="#cfeae2" />
      <path d="M22 43a4 4 0 0 1 4-4h9l4 5h20a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z" fill="#4ec4a6" />
      <circle cx="63" cy="60" r="9" fill="#2f9c81" />
      <path d="M59 60l3 3 5-5.5" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // הרשאות לצוות — מגן עם וי
  team: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <circle cx="48" cy="48" r="42" fill="#fdeecd" />
      <path d="M48 26l18 7v13c0 12-8 19.4-18 23-10-3.6-18-11-18-23V33z" fill="#f0a93f" />
      <path d="M48 32l13 5v9.7c0 8.8-5.6 14-13 17.1-7.4-3.1-13-8.3-13-17.1V37z" fill="#ffca73" />
      <path d="M41 49l5 5 11-11.5" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function FeatureArt({ name }) {
  return <span className="lp-art">{ART[name] || null}</span>;
}

export default FeatureArt;
