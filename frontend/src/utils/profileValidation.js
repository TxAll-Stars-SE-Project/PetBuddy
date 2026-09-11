import {
  isEmail,
  isTel,
  isPostal,
} from "./validators.js";

export function validateProfile(v) {
  const errors = {};

  if (!v.username.trim()) {
    errors.username = "กรุณากรอกชื่อผู้ใช้";
  } else if (v.username.length > 50) {
    errors.username = "ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร";
  }

  if (!v.email.trim()) {
    errors.email = "กรุณากรอกอีเมล";
  } else if (!isEmail(v.email)) {
    errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
  }

  if (!v.tel.trim()) {
    errors.tel = "กรุณากรอกเบอร์โทร";
  } else if (!isTel(v.tel)) {
    errors.tel = "เบอร์โทรต้องขึ้นต้นด้วย 0 และยาว 10 หลัก";
  }

  if (!v.address?.trim()) {
    errors.address = "กรุณากรอกรายละเอียดที่อยู่ (บ้านเลขที่, ซอย, ถนน)";
  } else if (v.address.length > 255) {
    errors.address = "รายละเอียดที่อยู่ต้องไม่เกิน 255 ตัวอักษร";
  }

  if (!v.province.trim()) {
    errors.province = "กรุณากรอกจังหวัด";
  } else if (v.province.length > 50) {
    errors.province = "จังหวัดต้องไม่เกิน 50 ตัวอักษร";
  }

  if (!v.district?.trim()) {
    errors.district = "กรุณากรอกเมือง/อำเภอ";
  } else if (v.district.length > 50) {
    errors.district = "เมือง/อำเภอต้องไม่เกิน 50 ตัวอักษร";
  }

  if (!v.subdistrict?.trim()) {
    errors.subdistrict = "กรุณากรอกตำบล/แขวง";
  } else if (v.subdistrict.length > 50) {
    errors.subdistrict = "ตำบล/แขวงต้องไม่เกิน 50 ตัวอักษร";
  }

  if (!v.postalCode.trim()) {
    errors.postalCode = "กรุณากรอกรหัสไปรษณีย์";
  } else if (!isPostal(v.postalCode)) {
    errors.postalCode = "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก";
  }

  if (v.role === "sitter" && !v.experience.trim()) {
    errors.experience = "กรุณากรอกประสบการณ์";
  }

  return errors;
}
