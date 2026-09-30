/*
  vendorReputation — "מוניטין" הספק, גזור מהביקורות שהוועדים כתבו. מקור אמת יחיד
  לשני הצדדים: הוועד רואה תג "ספק מצטיין" בכרטיס, והספק רואה את אותו מעמד בדיוק
  בדף הבית שלו ("הגעת לספק מצטיין 🏆"). כך אף צד לא רואה סטטוס שונה מהשני.

  הסף נבחר כך שהתג יישאר אמין: לא די בדירוג גבוה אחד — צריך כמה ביקורות כדי
  שהממוצע יהיה משמעותי. averageRating/reviewCount כבר מגיעים מוכנים מהשרת.
*/
export const TOP_RATED_MIN_AVG = 4.5;
export const TOP_RATED_MIN_REVIEWS = 3;

// כמה ביקורות צריך לפני שמתחילים להציג ממוצע בכלל (ביקורת בודדת אינה מוניטין)
export const RATING_MIN_REVIEWS = 1;

export function reviewCountOf(vendor) {
  return Number(vendor?.reviewCount) || 0;
}

export function averageRatingOf(vendor) {
  return Number(vendor?.averageRating) || 0;
}

/* ספק מצטיין — דירוג גבוה *וגם* מספיק ביקורות שיבססו אותו. */
export function isTopRated(vendor) {
  return (
    averageRatingOf(vendor) >= TOP_RATED_MIN_AVG &&
    reviewCountOf(vendor) >= TOP_RATED_MIN_REVIEWS
  );
}

/* האם יש בכלל דירוג להציג (לפחות ביקורת אחת). */
export function hasRating(vendor) {
  return reviewCountOf(vendor) >= RATING_MIN_REVIEWS;
}

/*
  reputationHint — משפט עידוד לספק לפי המצב שלו, להצגה בדף הבית. מכוון את הספק
  מה לעשות כדי לשפר את המוניטין (עוד ביקורות) או מברך אותו אם הוא כבר מצטיין.
*/
export function reputationHint(vendor) {
  const count = reviewCountOf(vendor);
  const avg = averageRatingOf(vendor);
  if (isTopRated(vendor)) {
    return "כל הכבוד! הדירוג הגבוה שלך מוצג לוועדים עם תג ‘ספק מצטיין’ 🏆";
  }
  if (count === 0) {
    return "עדיין אין ביקורות. ועד מרוצה יכול לדרג אותך בכרטיס שלך — דירוג טוב מושך עוד פניות.";
  }
  if (count < TOP_RATED_MIN_REVIEWS) {
    const left = TOP_RATED_MIN_REVIEWS - count;
    return `עוד ${left} ביקורות טובות ותקבל תג ‘ספק מצטיין’ שמוצג לוועדים 🏆`;
  }
  if (avg < TOP_RATED_MIN_AVG) {
    return "שירות מהיר ואדיב מעלה את הדירוג — וספק מצטיין מקבל יותר פניות.";
  }
  return "";
}
