import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "../utils/toast.js";
import { isEmail } from "../utils/validators.js";
import Logo from "../components/ui/Logo.jsx";
import TextInput from "../components/ui/TextInput.jsx";
import PasswordInput from "../components/ui/PasswordInput.jsx";
import Button from "../components/ui/Button.jsx";
import AlertBanner from "../components/ui/AlertBanner.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle");

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    
    const errs = {};
    if (!values.email.trim()) errs.email = "กรุณากรอกอีเมล";
    else if (!isEmail(values.email)) errs.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!values.password) errs.password = "กรุณากรอกรหัสผ่าน";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setStatus("submitting");
    try {
      await login(values.email, values.password);
      toast("เข้าสู่ระบบสำเร็จ");
      navigate("/");
    } catch (err) {
      if (err.status === 401) setFormError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      else setFormError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <h1 className="auth-title">ยินดีต้อนรับกลับ</h1>
        <p className="auth-sub">เข้าสู่ระบบเพื่อใช้งาน PetBuddy</p>

        {searchParams.get("expired") === "1" && (
          <AlertBanner type="info">เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง</AlertBanner>
        )}
        {formError && <AlertBanner type="error">{formError}</AlertBanner>}

        <form onSubmit={onSubmit} noValidate>
          <TextInput label="อีเมล" placeholder="you@example.com"
            value={values.email} onChange={set("email")} error={errors.email} />
          <PasswordInput label="รหัสผ่าน" placeholder="••••••••"
            value={values.password} onChange={set("password")} error={errors.password} />
          <Button type="submit" loading={status === "submitting"}>เข้าสู่ระบบ</Button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">ลืมรหัสผ่าน?</Link>
          <span className="dot">·</span>
          <Link to="/register">สมัครสมาชิก</Link>
        </div>
      </div>
    </div>
  );
}