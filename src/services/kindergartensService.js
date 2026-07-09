/*
  kindergartensService — שליפת שמות גני ילדים מהמאגר הרשמי של משרד החינוך
  (data.gov.il, מאגר "מאפייני מוסדות חינוך בפיקוח משרד החינוך").
  מסונן לסוג "גן ילדים", לפי העיר שנבחרה ולפי הטקסט שהוקלד. מחזיר מערך שמות
  ייחודיים (עד limit). הקריאה ישירה מהדפדפן — ה-API מתיר CORS.
  בכל כשל (שירות לא זמין / אין רשת) מחזיר [] — כך שהקלדה חופשית של שם גן
  תמיד עובדת, גם אם המאגר אינו זמין.
*/
const API_URL = "https://data.gov.il/api/3/action/datastore_search";
const RESOURCE_ID = "5548fd63-5868-4053-ad81-98caddc5e232";
const NAME_FIELD = "שם מוסד";
const CITY_FIELD = "שם ישוב";
const TYPE_FIELD = "סוג מוסד";
const KINDERGARTEN_TYPE = "גן ילדים";

export async function searchKindergartens(city, nameQuery, { limit = 10 } = {}) {
  const trimmedCity = (city || "").trim();
  const trimmedName = (nameQuery || "").trim();

  // בלי עיר, או בלי לפחות 2 תווים בשם — לא פונים למאגר (הקלדה חופשית בלבד)
  if (!trimmedCity || trimmedName.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    resource_id: RESOURCE_ID,
    filters: JSON.stringify({ [TYPE_FIELD]: KINDERGARTEN_TYPE }),
    q: JSON.stringify({ [CITY_FIELD]: trimmedCity, [NAME_FIELD]: trimmedName }),
    fields: NAME_FIELD,
    limit: String(limit),
  });

  try {
    const response = await fetch(`${API_URL}?${params.toString()}`);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    if (!data.success || !data.result) {
      return [];
    }
    const names = data.result.records
      .map((record) => record[NAME_FIELD])
      .filter(Boolean);
    // גן מופיע במאגר בשורה לכל שנה — מסירים כפילויות
    return [...new Set(names)];
  } catch {
    return [];
  }
}
