/*
  SocialIcon — אייקון עגול קטן לרשת חברתית, לפי שם הרשת (עברית/אנגלית).
  צבע המותג של הרשת + גליף לבן. רשת שלא זוהתה → אייקון גלובוס (אתר) כללי.
  שימוש: <SocialIcon label="אינסטגרם" size={30} />
*/

// קווי הגליף הלבנים — משותפים לכל האייקונים בקו
const L = {
  fill: "none",
  stroke: "#fff",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

// כל רשת: מילות זיהוי, צבע רקע, וגליף (ילדי <svg>)
const NETWORKS = [
  {
    keys: ["פייסבוק", "פייס", "facebook", "face", "fb"],
    bg: "#1877f2",
    glyph: (
      <path
        d="M13.4 20v-6.5h2.1l.4-2.6h-2.5V9.2c0-.7.2-1.2 1.3-1.2h1.3V5.7c-.3 0-1.1-.1-2-.1-2 0-3.3 1.2-3.3 3.3v1.9H8.4v2.6h2.3V20h2.7Z"
        fill="#fff"
      />
    ),
  },
  {
    keys: ["אינסטגרם", "אינסטה", "instagram", "insta", "ig"],
    bg: "#e1306c",
    glyph: (
      <>
        <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" {...L} />
        <circle cx="12" cy="12" r="3.6" {...L} />
        <circle cx="16.4" cy="7.6" r="1.15" fill="#fff" />
      </>
    ),
  },
  {
    keys: ["וואטסאפ", "וטסאפ", "וואצאפ", "whatsapp", "wa"],
    bg: "#25d366",
    glyph: (
      <>
        <path d="M4 20l1.2-3.5a7.3 7.3 0 1 1 2.8 2.4L4 20Z" {...L} />
        <path
          d="M9.3 8.9c.15 0 .35 0 .5.4l.5 1.2c.08.2 0 .38-.1.5l-.4.45c.42.85 1.05 1.5 1.9 1.9l.45-.45c.12-.14.3-.18.5-.1l1.2.5c.35.15.4.35.35.55-.1.65-.8 1.15-1.5 1.15-2 0-4.55-2.55-4.55-4.55 0-.7.55-1.4 1.25-1.4Z"
          fill="#fff"
        />
      </>
    ),
  },
  {
    keys: ["יוטיוב", "יוטיב", "youtube", "yt"],
    bg: "#ff0000",
    glyph: (
      <>
        <rect x="3.5" y="6.5" width="17" height="11" rx="3" {...L} />
        <path d="M11 9.8v4.4l3.8-2.2L11 9.8Z" fill="#fff" />
      </>
    ),
  },
  {
    keys: ["טיקטוק", "טיק", "tiktok"],
    bg: "#111111",
    glyph: (
      <path
        d="M13.5 4v9.2a2.7 2.7 0 1 1-2-2.6M13.5 4c.4 1.9 1.8 3.2 3.7 3.4"
        {...L}
      />
    ),
  },
  {
    keys: ["טלגרם", "טלה", "telegram", "tg"],
    bg: "#29a9eb",
    glyph: (
      <path
        d="M20.5 5.5 3.8 12l4.3 1.4 1.2 4.3 2.2-2.5 3.6 2.6 5.4-12.3Z"
        fill="#fff"
      />
    ),
  },
  {
    keys: ["לינקדאין", "לינקד", "linkedin"],
    bg: "#0a66c2",
    glyph: (
      <>
        <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" {...L} />
        <path
          d="M8 10.5V16M8 7.7v.02M11.7 16v-3c0-1 .8-1.9 1.9-1.9s1.9.9 1.9 1.9v3"
          {...L}
        />
      </>
    ),
  },
  {
    keys: ["פינטרסט", "פינ", "pinterest"],
    bg: "#e60023",
    glyph: (
      <path
        d="M12 4a8 8 0 0 0-2.9 15.4c-.1-.7-.1-1.7.1-2.5l1-4.1s-.2-.5-.2-1.2c0-1.1.6-2 1.4-2 .7 0 1 .5 1 1.1l-.7 2.9c-.2.7.4 1.3 1.1 1.3 1.3 0 2.2-1.7 2.2-3.6 0-1.5-1-2.6-2.9-2.6-2.1 0-3.4 1.6-3.4 3.3 0 .6.2 1.1.5 1.5.1.1.1.2.1.3l-.2.9c0 .2-.2.2-.3.1-.9-.4-1.4-1.6-1.4-2.6 0-2.2 1.8-4.2 5-4.2 2.6 0 4.4 1.9 4.4 4.1 0 2.7-1.5 4.7-3.7 4.7-.7 0-1.4-.4-1.7-.9l-.5 1.9c-.2.7-.6 1.4-.9 2A8 8 0 1 0 12 4Z"
        fill="#fff"
      />
    ),
  },
  {
    keys: ["x", "טוויטר", "twitter", "אקס"],
    bg: "#111111",
    glyph: <path d="M6 6l12 12M18 6 6 18" {...L} />,
  },
  {
    keys: ["אתר", "אינטרנט", "website", "site", "web"],
    bg: "#6b7a89",
    glyph: (
      <>
        <circle cx="12" cy="12" r="8.3" {...L} />
        <path
          d="M3.7 12h16.6M12 3.7c2.4 2.6 2.4 14 0 16.6M12 3.7c-2.4 2.6-2.4 14 0 16.6"
          {...L}
        />
      </>
    ),
  },
];

// ברירת מחדל — גלובוס (אתר) לרשת שלא זוהתה
const FALLBACK = NETWORKS[NETWORKS.length - 1];

function matchNetwork(label) {
  const t = (label || "").trim().toLowerCase();
  if (!t) return FALLBACK;
  return (
    NETWORKS.find((n) => n.keys.some((k) => t === k)) ||
    NETWORKS.find((n) => n.keys.some((k) => t.includes(k) || k.includes(t))) ||
    FALLBACK
  );
}

function SocialIcon({ label, size = 30 }) {
  const net = matchNetwork(label);
  const inner = Math.round(size * 0.62);
  return (
    <span
      className="social-icon"
      style={{ width: size, height: size, background: net.bg }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width={inner} height={inner}>
        {net.glyph}
      </svg>
    </span>
  );
}

export default SocialIcon;
