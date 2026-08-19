import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TOUR_STEPS } from "../services/tourSteps";
import { subscribeTour, markTourSeen } from "../services/tourBus";
import "../styles/tour.css";

/*
  Tour — מנוע "סיור ההיכרות". מציג סדרת חלוניות הסבר; כל "המשך" עובר לשלב הבא.
  לכל שלב יש מסך (route) ואלמנט להדגשה (selector). המנוע:
    1. מנווט למסך של השלב (אם צריך),
    2. ממתין עד שהאלמנט מופיע (הדף אולי עדיין נטען),
    3. גולל אליו, מדגיש אותו ב"חור אור" (spotlight) וממקם את החלונית לידו.
  אם האלמנט לא נמצא תוך זמן קצר — החלונית מופיעה במרכז עם ההסבר (נפילה רכה),
  כך שהסיור אף פעם לא נתקע.
*/
const GAP = 12; // רווח בין החלונית לאלמנט המודגש
const MARGIN = 12; // שוליים מינימליים מקצה המסך
const LOCATE_TIMEOUT = 3500; // כמה זמן לחכות לאלמנט לפני נפילה למרכז (מסכים נטענים lazy)
const POLL = 80;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// current = pathname+search; משווים לנתיב-היעד כדי לא לנווט לחינם
function samePath(target, current) {
  return target === current || (target === "/" && current === "/");
}

function Tour() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

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
    setActive(false);
    setRect(null);
    setPos(null);
  }, []);

  const next = useCallback(() => {
    if (index >= TOUR_STEPS.length - 1) finish();
    else setIndex(index + 1);
  }, [index, finish]);

  const back = useCallback(() => {
    if (index > 0) setIndex(index - 1);
  }, [index]);

  // נעילת גלילת הרקע כל עוד הסיור פעיל (האלמנט המודגש נשאר במקום)
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

  // ניווט + איתור האלמנט של השלב הנוכחי
  useEffect(() => {
    if (!active) return undefined;
    const s = TOUR_STEPS[index];
    setPhase("locating");
    setRect(null);
    setPos(null);

    const current = locationRef.current.pathname + locationRef.current.search;
    if (s.route && !samePath(s.route, current)) {
      navigate(s.route);
    }

    let cancelled = false;
    let elapsed = 0;
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
        // מדידה אחרי שהגלילה תפסה מקום
        requestAnimationFrame(() => {
          if (cancelled) return;
          setRect(el.getBoundingClientRect());
          setPhase("anchored");
        });
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
    };
  }, [active, index, navigate]);

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

  // מיקום החלונית ביחס לאלמנט המודגש (אחרי שהיא נמדדה)
  useLayoutEffect(() => {
    if (!active || phase !== "anchored" || !rect) return;
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
  const popStyle = centered
    ? undefined
    : pos
    ? { top: pos.top, left: pos.left }
    : { top: 0, left: 0, visibility: "hidden" }; // מדידה לפני מיקום

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
        <div
          ref={popRef}
          className={`tour__popover${centered ? " tour__popover--center" : ""}`}
          style={popStyle}
        >
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
