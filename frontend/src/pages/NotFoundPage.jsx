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

function NotFoundPage() {
  return (
    <div className="auth-page">
      <div className="auth-card notfound">
        <div className="nf-num">404</div>
        <h1>ไม่พบหน้าที่คุณกำลังหาอยู่</h1>
        <p className="muted">หน้าที่คุณมองหาไม่มีอยู่ หรือถูกย้ายไปแล้ว</p>
        <a className="btn btn--aslink" href="#/">กลับหน้าหลัก</a>
      </div>
    </div>
  );
}
export default NotFoundPage;