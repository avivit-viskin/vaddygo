/*
  imageUpload — הופך קובץ תמונה שנבחר מהטלפון (ספריית תמונות או קבצים) לתמונה
  מוטמעת (base64 data-URI) ומכווצת. כך אפשר לשמור אותה ישירות בשדה imageUrl של
  המוצר, בלי תשתית אחסון קבצים. הכיווץ נעשה בצד הלקוח כדי שהתמונה תישאר קטנה —
  טעינה מהירה למשתמש ובסיס-נתונים רזה.
*/
export function fileToResizedDataUrl(file, maxDim = 700, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith("image/")) {
      reject(new Error("צריך לבחור קובץ תמונה"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("לא הצלחנו לקרוא את הקובץ"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("לא הצלחנו לפתוח את התמונה"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
