/*
  productImageStyle — הסגנון להצגת תמונת מוצר בריבוע, לפי מיקום (object-position)
  וזום (transform scale) ששמר הספק. הזום ממורכז סביב נקודת המיקום כדי שההגדלה
  תרגיש טבעית. חובה שהמיכל הישיר של התמונה יהיה overflow: hidden כדי לגזור זום.
*/
export function productImageStyle(p) {
  const pos = (p?.imagePosition || "").trim() || "50% 50%";
  const zoom = Number(p?.imageZoom) || 1;
  const style = { objectPosition: pos };
  if (zoom > 1) {
    style.transform = `scale(${Math.min(4, zoom)})`;
    style.transformOrigin = pos;
  }
  return style;
}
