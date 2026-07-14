/*
  WhiteShirtIcon — אייקון חולצה לבנה קטן (SVG). משמש לסימון "ראש חודש" בלוח,
  כי בגן נהוג ללבוש חולצה לבנה לטקס ראש חודש. המסגרת בצבע הטקסט הנוכחי כדי
  שהחולצה הלבנה תהיה נראית על כל רקע.
*/
function WhiteShirtIcon({ size = 12 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path
        d="M8 3 4 6l2 3 2-1v11h8V8l2 1 2-3-4-3c-1 1.3-2.4 2.2-4 2.2S9 4.3 8 3z"
        fill="#ffffff"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default WhiteShirtIcon;
