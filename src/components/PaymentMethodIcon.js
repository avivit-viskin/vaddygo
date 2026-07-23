import { paymentMethodIcon } from "../services/paymentMethods";

/*
  PaymentMethodIcon — אייקון אמצעי תשלום. לביט ולפייבוקס מוצג תג-מותג קטן (צבע
  ושם האפליקציה) כדי שיהיה תואם למראה האפליקציות; לשאר (אשראי/מזומן) אמוג'י.
  משמש גם בקוביות מסך הבית וגם בחלון בקשת התשלום — כדי שיהיו זהים בכל מקום.
*/
function PaymentMethodIcon({ method }) {
  if (method === "bit") {
    return <span className="pay-brand pay-brand--bit">bit</span>;
  }
  if (method === "paybox") {
    return <span className="pay-brand pay-brand--paybox">payBox</span>;
  }
  return <span aria-hidden="true">{paymentMethodIcon(method)}</span>;
}

export default PaymentMethodIcon;
