import { NavLink } from "react-router-dom";

/*
  BottomNav — ניווט תחתון קבוע (Mobile-First), חמשת מסכי הליבה.
  כל פריט הוא אזור מגע של 44px לפחות (מוגדר ב-theme.css).
*/
const NAV_ITEMS = [
  { to: "/", label: "בית", icon: "🏠" },
  { to: "/students", label: "תלמידים", icon: "🎒" },
  { to: "/calendar", label: "לוח שנה", icon: "📅" },
  { to: "/gifts", label: "מתנות", icon: "🎁" },
  { to: "/files", label: "קבצים", icon: "📁" },
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
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
