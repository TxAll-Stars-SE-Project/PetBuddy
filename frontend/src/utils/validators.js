// src/utils/validators.js — ลดความซับซ้อน (backend handle checksum แล้ว)
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isTel = (v) => /^0\d{9}$/.test(v.replace(/[\s-]/g, ""));
export const isPostal = (v) => /^\d{5}$/.test(v);
export const isThaiId = (v) => /^\d{13}$/.test(v); // แค่ regex พอ
export const passwordOk = (v) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);
export const isUsername = (v) => typeof v === "string" && v.trim().length >= 3;