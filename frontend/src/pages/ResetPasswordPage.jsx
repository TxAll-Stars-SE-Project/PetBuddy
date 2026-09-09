import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../services/api.js";
import { passwordOk } from "../utils/validators.js";
import { toast } from "../utils/toast.js";
import Logo from "../components/ui/Logo.jsx";
import PasswordInput from "../components/ui/PasswordInput.jsx";
import Button from "../components/ui/Button.jsx";
import AlertBanner from "../components/ui/AlertBanner.jsx";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [values, setValues] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [expired, setExpired] = useState(false);
  const [status, setStatus] = useState("idle");

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!values.password || !passwordOk(values.password))
      errs.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยอักษรและตัวเลข";
    if (!values.confirm || values.confirm !== values.password)
      errs.confirm = "รหัสผ่านไม่ตรงกัน";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setStatus("submitting");
    try {
      await api.post("/auth/reset-password", { token, newPassword: values.password });
      toast("เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบ");
      navigate("/login");
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) setExpired(true);
      else toast("เกิดข้อผิดพลาด กรุณาลองใหม่", "info");
    } finally {
      setStatus("idle");
    }
  };

  if (expired || !token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Logo />
          <h1 className="auth-title">ตั้งรหัสผ่านใหม่</h1>
          <AlertBanner type="error">ลิงก์นี้หมดอายุหรือถูกใช้แล้ว</AlertBanner>
          <Link className="btn btn--aslink" to="/forgot-password">ขอลิงก์ใหม่</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <h1 className="auth-title">ตั้งรหัสผ่านใหม่</h1>
        <p className="auth-sub">ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ</p>
        <form onSubmit={onSubmit} noValidate>
          <PasswordInput label="รหัสผ่านใหม่" placeholder="อย่างน้อย 8 ตัว มีอักษร+ตัวเลข"
            value={values.password} onChange={set("password")} error={errors.password} />
          <PasswordInput label="ยืนยันรหัสผ่าน" placeholder="กรอกรหัสผ่านอีกครั้ง"
            value={values.confirm} onChange={set("confirm")} error={errors.confirm} />
          <Button type="submit" loading={status === "submitting"}>อัปเดตรหัสผ่าน</Button>
        </form>
      </div>
    </div>
  );
}