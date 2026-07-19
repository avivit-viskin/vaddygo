import { useEffect, useRef, useState } from "react";
import "../styles/pullToRefresh.css";

/*
  PullToRefresh — "משיכה לרענון" בנייד: כשמושכים את המסך כלפי מטה כשהוא בראש
  הדף, מופיע מחוון, ובשחרור מעבר לסף הדף מתרענן. במחשב (בלי מגע) לא קורה כלום.
*/
const THRESHOLD = 70; // כמה צריך למשוך (בפיקסלים) כדי להפעיל רענון
const MAX_PULL = 110; // מקסימום תזוזה חזותית

function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef(null);
  const active = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => {
    function onTouchStart(event) {
      // מתחילים רק כשגוללים בראש הדף, במגע יחיד, וכשלא כבר מרעננים
      if (
        window.scrollY <= 0 &&
        event.touches.length === 1 &&
        !refreshingRef.current
      ) {
        startY.current = event.touches[0].clientY;
        active.current = true;
      } else {
        active.current = false;
      }
    }

    function onTouchMove(event) {
      if (!active.current || startY.current == null) {
        return;
      }
      const delta = event.touches[0].clientY - startY.current;
      if (delta > 0 && window.scrollY <= 0) {
        // מונע את רענון-ברירת-המחדל של הדפדפן — מציגים את המחוון שלנו
        event.preventDefault();
        const damped = Math.min(delta * 0.5, MAX_PULL);
        pullRef.current = damped;
        setPull(damped);
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    }

    function onTouchEnd() {
      if (!active.current) {
        return;
      }
      active.current = false;
      startY.current = null;
      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPull(THRESHOLD);
        // רענון מהיר — נותנים רגע קצר להצגת המחוון
        window.setTimeout(() => window.location.reload(), 300);
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const visible = pull > 0 || refreshing;
  const ready = pull >= THRESHOLD;

  return (
    <div
      className="ptr"
      aria-hidden={!visible}
      style={{
        transform: `translateY(${visible ? pull : 0}px)`,
        // בזמן משיכה — בלי מעבר (עוקב אחרי האצבע); בשחרור — חזרה חלקה
        transition: active.current ? "none" : "transform 0.25s ease",
      }}
    >
      <div
        className={`ptr__circle${refreshing ? " ptr__circle--spin" : ""}`}
        style={
          refreshing
            ? undefined
            : { transform: `rotate(${Math.min(pull / MAX_PULL, 1) * 360}deg)` }
        }
      />
      <span className="ptr__text">
        {refreshing ? "מרענן..." : ready ? "שחררי לרענון" : "משכי לרענון"}
      </span>
    </div>
  );
}

export default PullToRefresh;
