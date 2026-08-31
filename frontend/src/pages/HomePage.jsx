import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { navigate } from "../router.js";
import { toast } from "../utils/toast.js";
import { api } from "../services/api.js";
import { isEmail, isTel, isPostal, isThaiId, passwordOk } from "../utils/validators.js";
import Logo from "../components/ui/Logo.jsx";
import TextInput from "../components/ui/TextInput.jsx";
import PasswordInput from "../components/ui/PasswordInput.jsx";
import Button from "../components/ui/Button.jsx";
import AlertBanner from "../components/ui/AlertBanner.jsx";
import RolePills from "../components/ui/RolePills.jsx";

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