const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);              // รูปแบบอีเมล
const isTel = (v) => /^0\d{9}$/.test(v.replace(/[\s-]/g, ""));            // เบอร์ 10 หลัก ขึ้นต้น 0
const isPostal = (v) => /^\d{5}$/.test(v);                                // รหัสไปรษณีย์ 5 หลัก
const isThaiId = (v) => /^\d{13}$/.test(v);                               // เลข ปชช. 13 หลัก
const passwordOk = (v) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v); // ≥8 มีอักษร+ตัวเลข

export { isEmail, isTel, isPostal, isThaiId, passwordOk };