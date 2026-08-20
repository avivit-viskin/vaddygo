import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { SUPPLIER_TOUR_STEPS } from "../services/supplierTourSteps";
import {
  subscribeSupplierTour,
  markSupplierTourSeen,
} from "../services/supplierTourBus";
import "../styles/tour.css";

/*
  SupplierTour — מנוע סיור ההיכרות של פורטל הספקים. אותו מנוע ויזואלי כמו סיור
  הוועד (spotlight + חלונית), אבל במקום לנווט ב-routes הוא מבקש מ-SupplierEditPage
  להעביר את המסך למצב הנכון של כל שלב (טאב / מודאל הדוח) דרך onActivate — כי
  הניווט בפורטל הספק הוא טאבים פנימיים ומצבי-קומפוננטה, לא כתובות.

  onActivate(step) — נקרא כשעוברים לשלב; ההורה מעביר את המסך למצב המתאים.
  onFinish() — ניקוי בסיום (סגירת מודאל הדוח).
*/
const GAP = 12;
const MARGIN = 12;
const LOCATE_TIMEOUT = 4000;
const POLL = 80;
const HINT_DELAY = 500;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function SupplierTour({ onActivate, onFinish }) {
  // refs כדי שהאפקטים לא ירוצו מחדש בכל רינדור של ההורה (הפונקציות נוצרות מחדש)
  const onActivateRef = useRef(onActivate);
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onActivateRef.current = onActivate;
  });
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("locating");
  const [rect, setRect] = useState(null);
  const [pos, setPos] = useState(null);
  const [hint, setHint] = useState(false);
  const popRef = useRef(null);

  const step = SUPPLIER_TOUR_STEPS[index];

  useEffect(
    () =>
      subscribeSupplierTour(() => {
        setIndex(0);
        setPhase("locating");
        setRect(null);
        setPos(null);
        setActive(true);
      }),
    []
  );

  const finish = useCallback(() => {
    markSupplierTourSeen();
    if (onFinishRef.current) onFinishRef.current();
    setActive(false);
    setRect(null);
    setPos(null);
  }, []);

  const next = useCallback(() => {
    if (index >= SUPPLIER_TOUR_STEPS.length - 1) finish();
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

  // Escape סוגר
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish]);

  // מעבר למצב הנכון (טאב/מודאל) + איתור האלמנט
  useEffect(() => {
    if (!active) return undefined;
    const s = SUPPLIER_TOUR_STEPS[index];
    setPhase("locating");
    setRect(null);
    setPos(null);
    setHint(false);

    if (onActivateRef.current) onActivateRef.current(s);

    let cancelled = false;
    let elapsed = 0;
    let settleTimer = null;
    const hintTimer = setTimeout(() => {
      if (!cancelled) setHint(true);
    }, HINT_DELAY);
    // מודאל הדוח נפתח באנימציה — נותנים לו קצת יותר זמן להתייצב לפני מדידה
    const settleMs = s.action === "report" ? 340 : 120;

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
        }, settleMs);
      } else {
        elapsed += POLL;
        if (elapsed >= LOCATE_TIMEOUT) {
          clearInterval(timer);
          clearTimeout(hintTimer);
          setPhase("center");
        }
      }
    }, POLL);

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(hintTimer);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [active, index]);

  // מדידה חוזרת כל 300ms — עוקב אחרי האלמנט אם הפריסה זזה (מעבר טאב/מודאל)
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
          return prev;
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

  // מיקום החלונית ביחס לאלמנט
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

  const isLast = index === SUPPLIER_TOUR_STEPS.length - 1;
  const centered = phase === "center";
  const popStyle = centered
    ? undefined
    : pos
    ? { top: pos.top, left: pos.left }
    : { top: 0, left: 0, visibility: "hidden" };

  return (
    <div
      className="tour"
      role="dialog"
      aria-modal="true"
      aria-label="סיור היכרות בפורטל הספקים"
    >
      <div
        className={`tour__blocker${
          phase === "anchored" ? "" : " tour__blocker--dim"
        }`}
      />

      {phase === "locating" && hint && (
        <div className="tour__loading">רגע…</div>
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
            שלב {index + 1} מתוך {SUPPLIER_TOUR_STEPS.length}
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

export default SupplierTour;
