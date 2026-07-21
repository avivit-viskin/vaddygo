import { NavLink } from "react-router-dom";

/*
  BottomNav — ניווט תחתון קבוע (Mobile-First), חמשת מסכי הליבה.
  אייקונים קוויים אחידים (SVG) שיורשים את צבע הקישור (currentColor) — מסודר
  ונקי יותר מאמוג'ים מעורבבים. כל פריט הוא אזור מגע של 44px לפחות.
*/
const ICONS = {
  home: (
    <>
      <path d="M3 10.6 11.3 3.4a1 1 0 0 1 1.4 0L21 10.6" />
      <path d="M5.5 9.5V19a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1V9.5" />
    </>
  ),
  students: (
    <>
      <path d="M6.5 9a5.5 5.5 0 0 1 11 0v9a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2Z" />
      <path d="M9 9a3 3 0 0 1 6 0" />
      <path d="M9.5 14h5v4.5h-5z" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9.5h16" />
      <path d="M8 3v3.5" />
      <path d="M16 3v3.5" />
    </>
  ),
  gifts: (
    <>
      <rect x="3.5" y="8" width="17" height="4" rx="1" />
      <path d="M5.5 12v7.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V12" />
      <path d="M12 8v12.5" />
      <path d="M12 8C11 4.5 8 4.5 8 6.2 8 8 10.5 8 12 8Z" />
      <path d="M12 8c1-3.5 4-3.5 4-1.8C16 8 13.5 8 12 8Z" />
    </>
  ),
  files: (
    <path d="M4 7.5a2 2 0 0 1 2-2h3.2l1.8 2H18a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
  ),
};

const NAV_ITEMS = [
  { to: "/", label: "בית", icon: "home" },
  { to: "/students", label: "תלמידים", icon: "students" },
  { to: "/calendar", label: "לוח שנה", icon: "calendar" },
  { to: "/gifts", label: "מתנות", icon: "gifts" },
  { to: "/files", label: "קבצים", icon: "files" },
];

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="ניווט ראשי">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `bottom-nav__link${isActive ? " active" : ""}`
          }
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {ICONS[item.icon]}
            </svg>
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
