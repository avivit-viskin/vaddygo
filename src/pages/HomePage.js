import Card from "../components/Card";
import BrandName from "../components/BrandName";

/*
  HomePage — מסך הבית. כרגע ברכת פתיחה; לוח המחוונים המלא ייבנה בשלב 4.
*/
function HomePage() {
  return (
    <Card title="ברוכה הבאה! 💜">
      <p>
        <BrandName /> היא המקום שבו ועד ההורים מנהל הכל — תלמידים, גבייה,
        אירועים ומתנות.
      </p>
      <p>מתחילים במסך התלמידים דרך הניווט למטה.</p>
    </Card>
  );
}

export default HomePage;
