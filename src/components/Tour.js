import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TOUR_STEPS } from "../services/tourSteps";
import { subscribeTour, markTourSeen } from "../services/tourBus";
import "../styles/tour.css";

/*
  Tour — מנוע "סיור ההיכרות". מציג סדרת חלוניות הסבר; כל "המשך" עובר לשלב הבא.

  הסיור **כולו רץ על מסך הבית** ואינו מנווט בין עמודים — כדי שלא תהיה טעינת-עמוד
  בין שלב לשלב. לשלבים של תפריט הצד (עריכת גבייה/הגדרות/פרו) פותחים את התפריט
  (openMenu) — פעולה מיידית — ומדגישים את הפריט שבתוכו.

  לכל שלב: מדגישים אלמנט ב"חור אור" (spotlight) וממקמים חלונית לידו. אם האלמנט
  לא נמצא תוך זמן קצר — החלונית מופיעה במרכז עם ההסבר (נפילה רכה), כך שהסיור
  אף פעם לא נתקע.

  onMenu(open) — נשלח מ-App כדי לפתוח/לסגור את תפריט הצד לפי הצורך.
*/
const GAP = 12; // רווח בין החלונית לאלמנט המודגש
const MARGIN = 12; // שוליים מינימליים מקצה המסך
const LOCATE_TIMEOUT = 3000; // כמה זמן לחכות לאלמנט לפני נפילה למרכז
const POLL = 80;
const MENU_SETTLE = 300; // המתנה להשלמת אנימציית פתיחת התפריט (0.2s) לפני מדידה
const SCROLL_SETTLE = 40;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function Tour({ onMenu }) {
  const navigate = useNavigate();

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  // phase: "locating" (מחפשים אלמנט) | "anchored" (נמצא — מדגישים) | "center" (נפילה למרכז)
  const [phase, setPhase] = useState("locating");
  const [rect, setRect] = useState(null);
  const [pos, setPos] = useState(null);
  const popRef = useRef(null);

  const step = TOUR_STEPS[index];

  // הפעלה מאפיק ה-tourBus (כפתור בתפריט / סגירת "ברוכים הבאים")
  useEffect(
    () =>
      subscribeTour(() => {
        setIndex(0);
        setPhase("locating");
        setRect(null);
        setPos(null);
        setActive(true);
      }),
    []
  );

  const finish = useCallback(() => {
    markTourSeen();
    if (onMenu) onMenu(false);
    setActive(false);
    setRect(null);
    setPos(null);
  }, [onMenu]);

  const next = useCallback(() => {
    if (index >= TOUR_STEPS.length - 1) finish();
    else setIndex(index + 1);
  }, [index, finish]);

  const back = useCallback(() => {
    if (index > 0) setIndex(index - 1);
  }, [index]);

  // הסיור כולו על מסך הבית — כשמתחילים, מוודאים שאנחנו שם (הבית נטען מיידית)
  useEffect(() => {
    if (active) navigate("/");
  }, [active, navigate]);

  // נעילת גלילת הרקע כל עוד הסיור פעיל
  useEffect(() => {
    if (!active) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  // Escape סוגר את הסיור
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish]);

  // איתור האלמנט של השלב הנוכחי (פתיחת תפריט אם צריך, ואז המתנה שהאלמנט יופיע)
  useEffect(() => {
    if (!active) return undefined;
    const s = TOUR_STEPS[index];
    setPhase("locating");
    setRect(null);
    setPos(null);

    // פותחים/סוגרים את תפריט הצד לפי השלב
    if (onMenu) onMenu(!!s.openMenu);

    let cancelled = false;
    let elapsed = 0;
    let settleTimer = null;
    const timer = setInterval(() => {
      if (cancelled) return;
      const el = document.querySelector(s.selector);
      if (el) {
        clearInterval(timer);
        try {
          el.scrollIntoView({ block: "center", inline: "nearest" });
        } catch {
          // דפדפנים ישנים — לא קריטי
        }
        // המתנה קצרה: גלילה/אנימציית התפריט מסתיימת לפני שמודדים
        settleTimer = setTimeout(
          () => {
            if (cancelled) return;
            setRect(el.getBoundingClientRect());
            setPhase("anchored");
          },
          s.openMenu ? MENU_SETTLE : SCROLL_SETTLE
        );
      } else {
        elapsed += POLL;
        if (elapsed >= LOCATE_TIMEOUT) {
          clearInterval(timer);
          setPhase("center"); // נפילה רכה — הסבר במרכז המסך
        }
      }
    }, POLL);

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [active, index, onMenu]);

  // כשהאלמנט זז (שינוי גודל חלון) — למדוד מחדש
  useEffect(() => {
    if (!active || phase !== "anchored") return undefined;
    const onResize = () => {
      const el = document.querySelector(step.selector);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, phase, step]);

  // מיקום החלונית ביחס לאלמנט (רק אם היא לא מעוגנת בתחתית)
  useLayoutEffect(() => {
    if (!active || phase !== "anchored" || !rect || step.dock === "bottom") {
      return;
    }
    const pop = popRef.current;
    if (!pop) return;
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    const placeAbove =
      step.placement === "top" ||
      (spaceBelow < ph + GAP + MARGIN && spaceAbove > spaceBelow);

    let top = placeAbove ? rect.top - ph - GAP : rect.bottom + GAP;
    top = clamp(top, MARGIN, vh - ph - MARGIN);

    let left = rect.left + rect.width / 2 - pw / 2;
    left = clamp(left, MARGIN, vw - pw - MARGIN);

    setPos({ top, left });
  }, [active, phase, rect, step]);

  if (!active) return null;

  const isLast = index === TOUR_STEPS.length - 1;
  const centered = phase === "center";
  const dockBottom = phase === "anchored" && step.dock === "bottom";

  let popClass = "tour__popover";
  if (centered) popClass += " tour__popover--center";
  else if (dockBottom) popClass += " tour__popover--bottom";

  // מיקום: מרכז/תחתית מטופלים ב-CSS; אחרת ממקמים ליד האלמנט (מוסתר עד שנמדד)
  const popStyle =
    centered || dockBottom
      ? undefined
      : pos
      ? { top: pos.top, left: pos.left }
      : { top: 0, left: 0, visibility: "hidden" };

  return (
    <div
      className="tour"
      role="dialog"
      aria-modal="true"
      aria-label="סיור היכרות באפליקציה"
    >
      <div
        className={`tour__blocker${
          phase === "anchored" ? "" : " tour__blocker--dim"
        }`}
      />

      {phase === "anchored" && rect && (
        <div
          className="tour__spotlight"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}

      {(phase === "anchored" || centered) && (
        <div ref={popRef} className={popClass} style={popStyle}>
          <div className="tour__count">
            שלב {index + 1} מתוך {TOUR_STEPS.length}
          </div>
          <h3 className="tour__title">{step.title}</h3>
          <p className="tour__body">{step.body}</p>
          <div className="tour__actions">
            <button type="button" className="tour__skip" onClick={finish}>
              דילוג
            </button>
            <div className="tour__buttons">
              {index > 0 && (
                <button type="button" className="tour__back" onClick={back}>
                  הקודם
                </button>
              )}
              <button type="button" className="tour__next" onClick={next}>
                {isLast ? "סיום 🎉" : "המשך"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tour;
