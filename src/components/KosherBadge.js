/*
  KosherBadge — חותמת "כשר" עגולה (כמו חותמת גומי) שמוצגת ליד שם הספק כשהוא
  מסומן ככשר. שימוש: {vendor.isKosher && <KosherBadge />}
*/
function KosherBadge() {
  return (
    <span
      title="עסק כשר"
      aria-label="עסק כשר"
      style={{
        display: "inline-grid",
        placeItems: "center",
        flexShrink: 0,
        width: 34,
        height: 34,
        borderRadius: "50%",
        color: "#1d7a3e",
        background: "#f2fbf5",
        border: "2px solid #1d7a3e",
        // טבעת פנימית נוספת — נותנת מראה של חותמת גומי (שתי מסגרות)
        boxShadow: "inset 0 0 0 2px #f2fbf5, inset 0 0 0 3px rgba(29, 122, 62, 0.4)",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.02em",
        lineHeight: 1,
        // הטיה קלה — כמו חותמת שהוטבעה ביד
        transform: "rotate(-8deg)",
        verticalAlign: "middle",
        whiteSpace: "nowrap",
      }}
    >
      כשר
    </span>
  );
}

export default KosherBadge;
