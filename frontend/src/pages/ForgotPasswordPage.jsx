import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import Logo from "../components/ui/Logo.jsx";
import TextInput from "../components/ui/TextInput.jsx";
import Button from "../components/ui/Button.jsx";
import AlertBanner from "../components/ui/AlertBanner.jsx";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("กรุณากรอกอีเมล");
      return;
    }
    setError("");
    setStatus("submitting");

    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      const statusCode = err.response?.status;
      if (statusCode >= 500) {
        setError("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
      } else {
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
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
            หากอีเมลนี้มีอยู่ในระบบ ลิงก์รีเซ็ตรหัสผ่านจะถูกส่งไปยังอีเมลของคุณ
          </AlertBanner>
          <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>
            กรุณาตรวจสอบกล่องจดหมาย (และโฟลเดอร์สแปม) แล้วคลิกลิงก์เพื่อตั้งรหัสผ่านใหม่
          </p>
          <div style={{ marginTop: 16 }}>
            <Link className="btn btn--aslink" to="/login">กลับหน้าเข้าสู่ระบบ</Link>
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
        <p className="auth-sub">กรอกอีเมลของคุณ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้</p>

        {error && <AlertBanner type="error">{error}</AlertBanner>}

        <form onSubmit={onSubmit} noValidate>
          <TextInput
            label="อีเมล"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" loading={status === "submitting"}>
            ส่งลิงก์รีเซ็ตรหัสผ่าน
          </Button>
        </form>

        <div className="auth-links">
          <Link to="/login">กลับสู่หน้าเข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
}