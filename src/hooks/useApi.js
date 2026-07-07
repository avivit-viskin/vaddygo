import { useCallback, useEffect, useState } from "react";

/*
  useApi — hook גנרי לטעינת נתונים מהשרת עם שלושת המצבים המחייבים:
  טעינה / שגיאה / נתונים. משמש בכל מסך שמביא מידע.

  fetcher חייב להיות פונקציה יציבה (מיובאת מ-service או עטופה ב-useCallback),
  אחרת הטעינה תרוץ בלולאה אינסופית.
*/
export default function useApi(fetcher) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setData(await fetcher());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, reload: load };
}
