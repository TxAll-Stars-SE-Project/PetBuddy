import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { navigate } from "../router.js";
import { toast } from "../utils/toast.js";
import { isEmail } from "../utils/validators.js";
import Logo from "../components/ui/Logo.jsx";
import TextInput from "../components/ui/TextInput.jsx";
import PasswordInput from "../components/ui/PasswordInput.jsx";
import Button from "../components/ui/Button.jsx";
import AlertBanner from "../components/ui/AlertBanner.jsx";

function LoginPage({ params }) {
  const { login } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle");

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    /* validate ฝั่ง client ก่อน (state: field error) */
    const errs = {};
    if (!values.email.trim()) errs.email = "กรุณากรอกอีเมล";
    else if (!isEmail(values.email)) errs.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!values.password) errs.password = "กรุณากรอกรหัสผ่าน";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setStatus("submitting"); // state: loading
    try {
      await login(values.email, values.password);
      toast("เข้าสู่ระบบสำเร็จ");
      navigate("/");
    } catch (err) {
      if (err.status === 401) setFormError("อีเมลหรือรหัสผ่านไม่ถูกต้อง"); // AC invalid
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

        {/* banner เซสชันหมดอายุ (ถูกเตะออกจากระบบกลางทาง) */}
        {params.get("expired") === "1" && (
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
          <a href="#/forgot-password">ลืมรหัสผ่าน?</a>
          <span className="dot">·</span>
          <a href="#/register">สมัครสมาชิก</a>
        </div>
        <div className="demo-hint">บัญชีทดสอบ: title@petbuddy.com / Password1</div>
      </div>
    </div>
  );
}

export default LoginPage;