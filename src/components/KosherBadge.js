/*
  KosherBadge — תגית "כשר" קטנה שמוצגת ליד שם הספק כשהוא מסומן ככשר.
  שימוש: {vendor.isKosher && <KosherBadge />}
*/
function KosherBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 11,
        fontWeight: 700,
        color: "#1d7a3e",
        background: "#e6f4ea",
        border: "1px solid #b7e0c4",
        borderRadius: 6,
        padding: "1px 7px",
        verticalAlign: "middle",
        whiteSpace: "nowrap",
      }}
    >
      ✓ כשר
    </span>
  );
}

export default KosherBadge;
