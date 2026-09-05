import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";

function HomePage() {
  const { user } = useAuth();
  return (
    <div>
      <Navbar />
      <main className="home-main">
        <div className="home-card">
          <h2>สวัสดี, {user?.username} 🐾</h2>
          <p>เข้าสู่ระบบสำเร็จ — พื้นที่นี้จะเป็น Search & Booking ใน Sprint 2</p>
          <p className="muted">
            บทบาท: {user?.role === "sitter" ? "พี่เลี้ยงสัตว์" : "เจ้าของสัตว์เลี้ยง"}
          </p>
        </div>
      </main>
    </div>
  );
}
export default HomePage;