const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);              // รูปแบบอีเมล
const isTel = (v) => /^0\d{9}$/.test(v.replace(/[\s-]/g, ""));            // เบอร์ 10 หลัก ขึ้นต้น 0
const isPostal = (v) => /^\d{5}$/.test(v);                                // รหัสไปรษณีย์ 5 หลัก
const passwordOk = (v) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v); // ≥8 มีอักษร+ตัวเลข
const isUsername = (v) => typeof v === "string" && v.trim().length >= 3;

/* ✅ Thai ID Modulo 11 Algorithm
   เลข 13 หลัก d1 d2 ... d13 ต้องสอดคล้องกับ:
   ((d1*13 + d2*12 + ... + d12*2) % 11) ผลต่างกับ 11 แล้ว % 10 ต้อง == d13
*/
function isThaiId(id) {
  if (!/^\d{13}$/.test(id)) return false;
  const digits = id.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += digits[i] * (13 - i);
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === digits[12];
}

export { isEmail, isTel, isPostal, isThaiId, passwordOk, isUsername };