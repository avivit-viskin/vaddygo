import { useRef } from "react";

/*
  ImagePositionEditor — עריכת תמונת מוצר בתוך ריבוע: **גרירה** ממרכזת (object-
  position) ו**מחוון זום** מגדיל/מקטין (transform scale). התצוגה גדולה כדי שהספק
  יראה אם התמונה "יושבת טוב". מחזיר position ("x% y%") ו-zoom (1-4) דרך callbacks.
*/
function parsePos(v) {
  const m = /(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/.exec(v || "");
  return m ? { x: +m[1], y: +m[2] } : { x: 50, y: 50 };
}
const clamp = (n) => Math.max(0, Math.min(100, n));

function ImagePositionEditor({
  src,
  position,
  zoom = 1,
  onPositionChange,
  onZoomChange,
  size = 240,
}) {
  const frameRef = useRef(null);
  const drag = useRef(null);
  const pos = parsePos(position);
  const z = Number(zoom) || 1;

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, x: pos.x, y: pos.y };
  }
  function onPointerMove(e) {
    if (!drag.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.current.startY) / rect.height) * 100;
    onPositionChange(`${clamp(drag.current.x - dx)}% ${clamp(drag.current.y - dy)}%`);
  }
  function endDrag() {
    drag.current = null;
  }

  const posStr = `${pos.x}% ${pos.y}%`;

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
          style={{
            objectPosition: posStr,
            transform: z > 1 ? `scale(${z})` : undefined,
            transformOrigin: posStr,
          }}
        />
      </div>

      <label className="img-pos__zoom">
        <span aria-hidden="true">🔍</span> הגדלה
        <input
          type="range"
          min="1"
          max="4"
          step="0.1"
          value={z}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          aria-label="הגדלת התמונה"
        />
      </label>

      <div className="img-pos__actions">
        <p className="img-pos__hint">גררו את התמונה למירכוז, והזיזו את המחוון להגדלה 🎯</p>
        <button
          type="button"
          className="img-pos__reset"
          onClick={() => {
            onPositionChange("50% 50%");
            onZoomChange(1);
          }}
        >
          איפוס
        </button>
      </div>
    </div>
  );
}

export default ImagePositionEditor;
