import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TOUR_STEPS } from "../services/tourSteps";
import { subscribeTour, markTourSeen } from "../services/tourBus";
import { preloadTourPages } from "../services/tourPreload";
import "../styles/tour.css";

/*
  Tour — מנוע "סיור ההיכרות". מציג סדרת חלוניות הסבר; כל "המשך" עובר לשלב הבא.
  הסיור נכנס למסך האמיתי של כל שלב ומדגיש בו את האלמנט ב"חור אור" (spotlight).

  כדי שלא תהיה טעינה ארוכה בין שלב לשלב: ברגע שהסיור מתחיל טוענים מראש את כל
  חבילות הקוד של המסכים (preloadTourPages), כך שהניווט מיידי. אם בכל זאת יש
  עיכוב קצר (שאיבת נתונים) — מציגים חיווי "רגע…" עדין רק אם העיכוב מורגש.

  אם האלמנט לא נמצא תוך זמן קצר — החלונית מופיעה במרכז עם ההסבר (נפילה רכה),
  כך שהסיור אף פעם לא נתקע.
*/
const GAP = 12; // רווח בין החלונית לאלמנט המודגש
const MARGIN = 12; // שוליים מינימליים מקצה המסך
const LOCATE_TIMEOUT = 4000; // כמה זמן לחכות לאלמנט לפני נפילה למרכז
const POLL = 80;
const HINT_DELAY = 400; // רק אחרי עיכוב מורגש מציגים "רגע…" (מעברים מהירים לא מהבהבים)

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
  // phase: "locating" (מחפשים אלמנט) | "anchored" (נמצא) | "center" (נפילה למרכז)
  const [phase, setPhase] = useState("locating");
  const [rect, setRect] = useState(null);
  const [pos, setPos] = useState(null);
  const [hint, setHint] = useState(false); // חיווי "רגע…" בעיכוב מורגש
  const popRef = useRef(null);

  const step = TOUR_STEPS[index];

  // הפעלה מאפיק ה-tourBus (כפתור בתפריט / סגירת "ברוכים הבאים")
  useEffect(
    () =>
      subscribeTour(() => {
        preloadTourPages(); // טעינה מראש כדי שהניווט בין השלבים יהיה מיידי
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

  // ניווט למסך של השלב + איתור האלמנט
  useEffect(() => {
    if (!active) return undefined;
    const s = TOUR_STEPS[index];
    setPhase("locating");
    setRect(null);
    setPos(null);
    setHint(false);

    const current = locationRef.current.pathname + locationRef.current.search;
    if (s.route && !samePath(s.route, current)) {
      navigate(s.route);
    }

    let cancelled = false;
    let elapsed = 0;
    let settleTimer = null;
    // מציגים "רגע…" רק אם האיתור נמשך מעבר לסף (מעבר מהיר לא מהבהב)
    const hintTimer = setTimeout(() => {
      if (!cancelled) setHint(true);
    }, HINT_DELAY);

    const timer = setInterval(() => {
      if (cancelled) return;
      const el = document.querySelector(s.selector);
      if (el) {
        clearInterval(timer);
        clearTimeout(hintTimer);
        try {
          el.scrollIntoView({ block: "center", inline: "nearest" });
        } catch {
          // דפדפנים ישנים — לא קריטי
        }
        settleTimer = setTimeout(() => {
          if (cancelled) return;
          setRect(el.getBoundingClientRect());
          setPhase("anchored");
        }, 40);
      } else {
        elapsed += POLL;
        if (elapsed >= LOCATE_TIMEOUT) {
          clearInterval(timer);
          clearTimeout(hintTimer);
          setPhase("center"); // נפילה רכה — הסבר במרכז המסך
        }
      }
    }, POLL);

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(hintTimer);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [active, index, navigate]);

  // כל עוד מדגישים — נמדוד מחדש כל 300ms (ובשינוי גודל). כך אם הדף מסיים לטעון
  // נתונים והאלמנט זז/מתחלף, "חור האור" עוקב אחריו (עם מעבר חלק ב-CSS).
  useEffect(() => {
    if (!active || phase !== "anchored") return undefined;
    const remeasure = () => {
      const el = document.querySelector(step.selector);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect((prev) => {
        if (
          prev &&
          Math.abs(prev.top - r.top) < 1 &&
          Math.abs(prev.left - r.left) < 1 &&
          Math.abs(prev.width - r.width) < 1 &&
          Math.abs(prev.height - r.height) < 1
        ) {
          return prev; // ללא שינוי — לא מרנדרים מחדש לחינם
        }
        return r;
      });
    };
    const id = setInterval(remeasure, 300);
    window.addEventListener("resize", remeasure);
    return () => {
      clearInterval(id);
      window.removeEventListener("resize", remeasure);
    };
  }, [active, phase, step]);

  // מיקום החלונית ביחס לאלמנט המודגש
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

      {/* חיווי "רגע…" בזמן מעבר עם עיכוב מורגש בלבד */}
      {phase === "locating" && hint && (
        <div className="tour__loading">רגע, נכנסים למסך…</div>
      )}

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
