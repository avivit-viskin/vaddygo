/*
  payment — קישור התשלום למנוי הפרו (עמוד תשלום קבוע ב-GROW).

  זהו קישור אחד לכל המערכת — התשלום הוא ל-VaddyGo (לא לכל ועד בנפרד).
  כשיהיה לך הקישור מ-GROW, יש שתי דרכים להפעיל את הכפתור "מעבר לתשלום מאובטח"
  בעמוד השדרוג:
    1. הכי פשוט: לשלוח לי את הקישור ואני אדביק אותו כאן בין המרכאות.
    2. או להגדיר ב-Railway (שירות הפרונט) משתנה בשם REACT_APP_PRO_PAYMENT_URL.
  כל עוד ריק — הכפתור פשוט לא מוצג (ונשאר "אשמח לשמוע עוד").
*/
export const PRO_PAYMENT_URL =
  process.env.REACT_APP_PRO_PAYMENT_URL ||
  "https://pay.grow.link/MTAzODcx~2e4901218c89fe0e314cda81ad69aedd-MzgwMTEwMg";
