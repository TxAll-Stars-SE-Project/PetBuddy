import { useState } from "react";
import { api } from "../services/api.js";
import { isEmail } from "../utils/validators.js";
import Logo from "../components/ui/Logo.jsx";
import TextInput from "../components/ui/TextInput.jsx";
import Button from "../components/ui/Button.jsx";
import AlertBanner from "../components/ui/AlertBanner.jsx";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !isEmail(email)) { setError("รูปแบบอีเมลไม่ถูกต้อง"); return; }
    setError("");
    setStatus("submitting");
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setSent(true); // แม้ API พังก็แสดง success (ไม่เปิดเผยว่ามีอีเมลหรือไม่)
    } finally {
      setStatus("idle");
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Logo />
          <h1 className="auth-title">ตรวจสอบอีเมลของคุณ</h1>
          <AlertBanner type="success">
            ระบบส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว (ลิงก์มีอายุ 15 นาที)
          </AlertBanner>
          <div className="link-col">
            <a href="#/reset-password?token=mock123">ทดสอบ: เปิดลิงก์รีเซ็ต (ใช้งานได้)</a>
            <a href="#/reset-password?token=expired">ทดสอบ: เปิดลิงก์ที่หมดอายุ</a>
            <a href="#/login">กลับหน้าเข้าสู่ระบบ</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <h1 className="auth-title">ลืมรหัสผ่าน?</h1>
        <p className="auth-sub">กรอกอีเมลที่ลงทะเบียนไว้ ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านให้</p>
        <form onSubmit={onSubmit} noValidate>
          <TextInput label="อีเมล" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <Button type="submit" loading={status === "submitting"}>ส่งลิงก์รีเซ็ตรหัสผ่าน</Button>
        </form>
        <div className="auth-links">
          <a href="#/login">กลับหน้าเข้าสู่ระบบ</a>
        </div>
      </div>
    </div>
  );
}
export default ForgotPasswordPage;