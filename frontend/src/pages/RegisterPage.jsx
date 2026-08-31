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
function validateRegister(v) {
  const e = {};
  if (!v.username.trim()) e.username = "กรุณากรอกชื่อผู้ใช้";
  else if (v.username.length > 50) e.username = "ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร";

  if (!v.email.trim()) e.email = "กรุณากรอกอีเมล";
  else if (!isEmail(v.email)) e.email = "รูปแบบอีเมลไม่ถูกต้อง";

  if (!v.password) e.password = "กรุณากรอกรหัสผ่าน";
  else if (!passwordOk(v.password)) e.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยอักษรและตัวเลข";

  if (!v.confirm || v.confirm !== v.password) e.confirm = "รหัสผ่านไม่ตรงกัน";

  if (!v.tel.trim()) e.tel = "กรุณากรอกเบอร์โทร";
  else if (!isTel(v.tel)) e.tel = "เบอร์โทรต้องขึ้นต้นด้วย 0 และยาว 10 หลัก";

  if (!v.province.trim()) e.province = "กรุณากรอกจังหวัด";
  else if (v.province.length > 20) e.province = "จังหวัดต้องไม่เกิน 20 ตัวอักษร";

  if (!v.city.trim()) e.city = "กรุณากรอกเมือง/อำเภอ";
  else if (v.city.length > 50) e.city = "เมือง/อำเภอต้องไม่เกิน 50 ตัวอักษร";

  if (!v.postalCode.trim()) e.postalCode = "กรุณากรอกรหัสไปรษณีย์";
  else if (!isPostal(v.postalCode)) e.postalCode = "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก";

  /* ฟิลด์เพิ่มเติมเฉพาะบทบาทพี่เลี้ยง (ตาราง PetSitter) */
  if (v.role === "sitter") {
    if (!isThaiId(v.thaiId)) e.thaiId = "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก";
    if (!v.experience.trim()) e.experience = "กรุณากรอกประสบการณ์";
  }
  if (!v.consent) e.consent = "กรุณายินยอมก่อนสมัครสมาชิก"; // privacy requirement
  return e;
}

function RegisterPage() {
  const [values, setValues] = useState({
    role: "owner", username: "", email: "", password: "", confirm: "",
    tel: "", province: "", city: "", postalCode: "",
    thaiId: "", experience: "", consent: false,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle");

  const set = (k) => (e) =>
    setValues((v) => ({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const errs = validateRegister(values);
    setErrors(errs);
    if (Object.keys(errs).length) return; // AC invalid: block ก่อนส่ง

    setStatus("submitting");
    try {
      /* payload ตรงกับ body ของ POST /auth/register ใน contract เป๊ะ */
      const payload = {
        username: values.username, email: values.email, password: values.password,
        tel: values.tel, province: values.province, city: values.city,
        postalCode: values.postalCode, role: values.role, consent: values.consent,
        ...(values.role === "sitter"
          ? { thaiId: values.thaiId, experience: values.experience }
          : {}),
      };
      await api.post("/auth/register", payload); // AC valid
      toast("สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ");
      navigate("/login");
    } catch (err) {
      if (err.status === 400 && Array.isArray(err.data?.errors)) {
        /* backend ส่ง errors รายฟิลด์มา → map ลงใต้ฟิลด์นั้น ๆ */
        setErrors(Object.fromEntries(err.data.errors.map((x) => [x.field, x.message])));
      } else if (err.status === 409) {
        setErrors({ email: "อีเมลนี้ถูกใช้งานแล้ว" }); // AC invalid: email ซ้ำ
      } else {
        setFormError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <Logo />
        <h1 className="auth-title">สร้างบัญชี PetBuddy</h1>
        <p className="auth-sub">เข้าร่วมเป็นครอบครัวคนรักสัตว์</p>

        {formError && <AlertBanner type="error">{formError}</AlertBanner>}

        <form onSubmit={onSubmit} noValidate>
          <RolePills value={values.role} onChange={(r) => setValues((v) => ({ ...v, role: r }))} />

          <div className="grid-2">
            <TextInput label="ชื่อผู้ใช้" placeholder="เช่น TanINWZA"
              value={values.username} onChange={set("username")} error={errors.username} />
            <TextInput label="อีเมล" placeholder="you@example.com"
              value={values.email} onChange={set("email")} error={errors.email} />
            <PasswordInput label="รหัสผ่าน" placeholder="อย่างน้อย 8 ตัว มีอักษร+ตัวเลข"
              value={values.password} onChange={set("password")} error={errors.password} />
            <PasswordInput label="ยืนยันรหัสผ่าน" placeholder="กรอกรหัสผ่านอีกครั้ง"
              value={values.confirm} onChange={set("confirm")} error={errors.confirm} />
            <TextInput label="เบอร์โทร" placeholder="0988888888"
              value={values.tel} onChange={set("tel")} error={errors.tel} />
            <TextInput label="รหัสไปรษณีย์" placeholder="10330"
              value={values.postalCode} onChange={set("postalCode")} error={errors.postalCode} />
            <TextInput label="จังหวัด" placeholder="Bangkok"
              value={values.province} onChange={set("province")} error={errors.province} />
            <TextInput label="เมือง/อำเภอ" placeholder="Pathum Wan"
              value={values.city} onChange={set("city")} error={errors.city} />
          </div>

          {/* conditional fields: แสดงเมื่อเลือก "พี่เลี้ยงสัตว์" */}
          {values.role === "sitter" && (
            <div className="grid-2">
              <TextInput label="เลขบัตรประชาชน (13 หลัก)" placeholder="1101601805057"
                value={values.thaiId} onChange={set("thaiId")} error={errors.thaiId} />
              <TextInput label="ประสบการณ์การดูแลสัตว์" placeholder="เล่าประสบการณ์ของคุณ"
                value={values.experience} onChange={set("experience")} error={errors.experience} />
            </div>
          )}

          <div className="field">
            <label className="checkbox">
              <input type="checkbox" checked={values.consent} onChange={set("consent")} />
              <span>ยินยอมให้เก็บและใช้ข้อมูลส่วนบุคคลตามนโยบายความเป็นส่วนตัว</span>
            </label>
            {errors.consent && <div className="field-error">{errors.consent}</div>}
          </div>

          <Button type="submit" loading={status === "submitting"}>สมัครสมาชิก</Button>
        </form>

        <div className="auth-links">
          <span className="muted">มีบัญชีแล้ว?</span>
          <a href="#/login">เข้าสู่ระบบ</a>
        </div>
        <div className="demo-hint">ทดสอบ email ซ้ำ (409): duplicate@petbuddy.com</div>
      </div>
    </div>
  );
}
export default RegisterPage;