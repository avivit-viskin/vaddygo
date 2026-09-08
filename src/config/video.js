/*
  video — סרטון ההסבר של VaddyGo, שמוצג בתוך המערכת.

  ⚠️ כל עוד הכתובת ריקה — **שום כפתור סרטון אינו מוצג** בשום מקום. זו אותה
  גישה כמו בקישורי התשלום: עדיף שלא יהיה כפתור מאשר כפתור שמוביל לשום מקום.

  כשיהיה לך הסרטון, יש שתי דרכים להפעיל אותו:
    1. הכי פשוט: לשלוח לי את הקישור ואני אדביק אותו כאן בין המרכאות.
    2. או להגדיר ב-Railway (שירות הפרונט) משתנה בשם REACT_APP_HELP_VIDEO_URL.

  מה אפשר לשים כאן:
    • קישור ליוטיוב  — https://www.youtube.com/watch?v=XXXX  או  https://youtu.be/XXXX
    • קישור ל-Vimeo  — https://vimeo.com/123456789
    • קובץ וידאו ישיר — כתובת שמסתיימת ב-‎.mp4

  🔒 פרטיות: קישורי יוטיוב מומרים אוטומטית ל-youtube-nocookie.com (מצב פרטיות
  מוגבר של יוטיוב) — כדי שצפייה בסרטון בתוך המערכת לא תשתיל עוגיות פרסום
  לוועדים. זה גם מה שמאפשר להצהיר על כך בשאלון הפרטיות בלי הסתייגות.
*/
export const HELP_VIDEO_URL = process.env.REACT_APP_HELP_VIDEO_URL || "";

/*
  כותרת הסרטון — מוצגת בראש החלון שנפתח. אפשר לשנות בלי לגעת בשום דבר אחר.
*/
export const HELP_VIDEO_TITLE = "איך זה עובד — סרטון קצר";

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
