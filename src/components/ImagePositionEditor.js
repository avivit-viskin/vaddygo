import { useRef } from "react";

/*
  ImagePositionEditor — גרירת תמונת מוצר בתוך ריבוע כדי למרכז אותה. התמונה מוצגת
  ב-object-fit: cover (בדיוק כמו בכל מקום שהיא מוצגת), והגרירה מזיזה את המוקד
  (object-position). מחזיר מחרוזת "x% y%" ל-onChange. תצוגה גדולה כדי שהספק
  יראה אם התמונה "יושבת טוב".
*/
function parsePos(v) {
  const m = /(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/.exec(v || "");
  return m ? { x: +m[1], y: +m[2] } : { x: 50, y: 50 };
}
const clamp = (n) => Math.max(0, Math.min(100, n));

function ImagePositionEditor({ src, value, onChange, size = 240 }) {
  const frameRef = useRef(null);
  const drag = useRef(null);
  const pos = parsePos(value);

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, x: pos.x, y: pos.y };
  }
  function onPointerMove(e) {
    if (!drag.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    // גרירת התמונה ימינה חושפת את הצד השמאלי → object-position x קטן; לכן מחסירים
    const dx = ((e.clientX - drag.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.current.startY) / rect.height) * 100;
    onChange(`${clamp(drag.current.x - dx)}% ${clamp(drag.current.y - dy)}%`);
  }
  function endDrag() {
    drag.current = null;
  }

  return (
    <div className="img-pos">
      <div
        ref={frameRef}
        className="img-pos__frame"
        style={{ width: size, height: size }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          src={src}
          alt=""
          className="img-pos__img"
          draggable={false}
          style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
        />
      </div>
      <div className="img-pos__actions">
        <p className="img-pos__hint">גררו את התמונה כדי למרכז אותה בריבוע 🎯</p>
        <button
          type="button"
          className="img-pos__reset"
          onClick={() => onChange("50% 50%")}
        >
          איפוס למרכז
        </button>
      </div>
    </div>
  );
}

export default ImagePositionEditor;
