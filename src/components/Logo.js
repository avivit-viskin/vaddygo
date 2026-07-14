import { useState } from "react";
import BrandName from "./BrandName";

/*
  Logo — הלוגו של VaddyGo בכותרת. מציג את תמונת הלוגו (public/logo.png);
  כל עוד הקובץ לא הועלה, נופל אלגנטית לכיתוב "VaddyGo" — כך אין תמונה שבורה.
  ברגע שמעלים public/logo.png, הוא מופיע אוטומטית.
*/
function Logo() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <BrandName />;
  }

  return (
    <img
      src={`${process.env.PUBLIC_URL}/logo.jpg`}
      alt="VaddyGo"
      className="app-logo"
      onError={() => setFailed(true)}
    />
  );
}

export default Logo;
