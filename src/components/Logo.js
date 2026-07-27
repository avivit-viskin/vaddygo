import { useState } from "react";
import BrandName from "./BrandName";

/*
  Logo — הלוגו של VaddyGo בכותרת. מציג את תמונת הלוגו (public/logo512.png —
  גרסה חדה 512px); כל עוד הקובץ לא הועלה, נופל אלגנטית לכיתוב "VaddyGo" — כך
  אין תמונה שבורה. ברגע שמעלים את הקובץ, הוא מופיע אוטומטית.
*/
function Logo() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <BrandName />;
  }

  return (
    // logo512 (512px) ולא logo.png (256px) — כדי שהלוגו יישאר חד גם במסכי
    // רזולוציה גבוהה (רטינה/נייד), במיוחד כשמוצג בגדול (טעינה/כניסה)
    <img
      src={`${process.env.PUBLIC_URL}/logo512.png`}
      alt="VaddyGo"
      className="app-logo"
      onError={() => setFailed(true)}
    />
  );
}

export default Logo;
