import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="auth-page">
      <div className="auth-card notfound">
        <div className="nf-num">404</div>
        <h1>ไม่พบหน้าที่คุณกำลังหาอยู่</h1>
        <p className="muted">หน้าที่คุณมองหาไม่มีอยู่ หรือถูกย้ายไปแล้ว</p>
        <Link className="btn btn--aslink" to="/">กลับหน้าหลัก</Link>
      </div>
    </div>
  );
}