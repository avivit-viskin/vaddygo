// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

/*
  מרווחי זמן לבדיקות — נדרשו אחרי שהמסכים עברו לטעינה לפי דרישה (React.lazy
  ב-App.js): כל בדיקה שמרנדרת מסך ממתינה עכשיו גם לטעינת החבילה שלו, וכשכל
  הסוויטות רצות במקביל (וב-CI, על מכונה חלשה יותר) ההמתנה חוצה את ברירות
  המחדל. התוצאה הייתה בדיקות שנכשלות למרות שהקוד תקין — "רעש" שחוסם פריסה
  לכולם.

  שתי המגבלות הן **תקרות, לא המתנות**: בדיקה שעוברת מסיימת מיד.
    • jest.setTimeout — כמה זמן מותר לבדיקה שלמה (ברירת מחדל 5 שניות).
    • asyncUtilTimeout — כמה זמן findBy ו-waitFor מחכים (ברירת מחדל שנייה
      אחת, וזו הייתה הסיבה בפועל לכישלונות).
*/
jest.setTimeout(20000);
configure({ asyncUtilTimeout: 5000 });
