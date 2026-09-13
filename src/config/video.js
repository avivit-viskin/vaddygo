/*
  video — סרטון ההסבר של VaddyGo, שמוצג בתוך המערכת.

  הסרטון מוגש מהאתר שלנו (public/help/) ולא משירות חיצוני — ראו ההסבר
  ליד HELP_VIDEO_URL. אפשר להחליף אותו בקישור יוטיוב/Vimeo דרך משתנה
  הסביבה REACT_APP_HELP_VIDEO_URL, בלי שינוי קוד.

  מה מזוהה כאן:
    • קובץ וידאו — כתובת מלאה או נתיב באתר (‎.webm / ‎.mp4 / ‎.ogg)
    • קישור ליוטיוב — https://www.youtube.com/watch?v=XXXX או https://youtu.be/XXXX
    • קישור ל-Vimeo — https://vimeo.com/123456789

  ⚠️ כתובת ריקה או לא מזוהה = **שום כפתור סרטון אינו מוצג** בשום מקום. עדיף
  שלא יהיה כפתור מאשר כפתור שפותח חלון ריק.

  🔒 פרטיות: קישורי יוטיוב מומרים אוטומטית ל-youtube-nocookie.com (מצב הפרטיות
  המוגבר), והנגן עצמו נוצר רק בלחיצה — מי שלא ביקש לצפות אינו שולח בקשה לאף
  שירות חיצוני ואינו מקבל עוגיות.
*/
/*
  ברירת המחדל היא הסרטון שמוגש **מהאתר שלנו** ולא מיוטיוב.

  למה: אין צד שלישי, אין עוגיות, אין תלות בשירות חיצוני, והסרטון נטען גם
  ברשת שחוסמת יוטיוב. המחיר הוא 2.5MB בתוך הפריסה — זניח.

  הסרטון הוקלט מהמערכת עצמה על "גן הדגמה" עם נתונים מומצאים בלבד: אין בו
  שום שם, טלפון או נתון של ילד אמיתי.

  להחלפה: או להחליף את הקובץ ב-public/help/, או להגדיר
  REACT_APP_HELP_VIDEO_URL (למשל לקישור יוטיוב) — והוא גובר.
*/
export const HELP_VIDEO_URL =
  process.env.REACT_APP_HELP_VIDEO_URL || "/help/vaddygo-explainer.webm";

/*
  כותרת הסרטון — מוצגת בראש החלון שנפתח. אפשר לשנות בלי לגעת בשום דבר אחר.
*/
export const HELP_VIDEO_TITLE = "איך זה עובד — שתי דקות";

/*
  ממיר כתובת "רגילה" לכתובת שאפשר להטמיע. מחזיר:
    { kind: "iframe", src }  — יוטיוב / Vimeo
    { kind: "file", src }    — קובץ וידאו ישיר
    null                     — אין כתובת, או שאינה מזוהה

  למה כאן ולא ברכיב: כדי שאפשר יהיה לבדוק את ההמרה בלי לצייר מסך, ובעיקר —
  כדי שהדבקת קישור "רגיל" מיוטיוב פשוט תעבוד. אף אחד לא אמור להיות חייב לדעת
  מה ההבדל בין כתובת צפייה לכתובת הטמעה.
*/
export function toEmbed(url = HELP_VIDEO_URL) {
  const raw = (url || "").trim();
  if (!raw) {
    return null;
  }

  // קובץ וידאו ישיר
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(raw)) {
    return { kind: "file", src: raw };
  }

  // יוטיוב — כל הצורות: watch?v= · youtu.be/ · embed/ · shorts/
  const yt =
    raw.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ||
    raw.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ||
    raw.match(/youtube(?:-nocookie)?\.com\/(?:embed|shorts)\/([A-Za-z0-9_-]{6,})/);
  if (yt) {
    // nocookie = מצב הפרטיות המוגבר של יוטיוב. rel=0 מונע הצעת סרטונים של
    // אחרים בסוף — לא רוצים שהוועד יגלוש מכאן למקום אחר.
    return {
      kind: "iframe",
      src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0`,
    };
  }

  const vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  }

  return null;
}

/* האם יש סרטון להצגה — כל כפתורי הסרטון נשענים על זה. */
export function hasHelpVideo() {
  return toEmbed() !== null;
}
