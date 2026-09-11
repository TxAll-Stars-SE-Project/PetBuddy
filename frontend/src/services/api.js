// src/services/api.js — ใช้ axios ตามที่เพื่อน backend แนะนำ
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Interceptor: แปะ Token อัตโนมัติก่อนยิงทุก request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: จัดการ 401 — แยก "login ผิด" ออกจาก "session หมดอายุจริง"
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const reqUrl = error.config?.url || "";

    // 👇 401 + มี token อยู่ + ไม่ใช่ request login/register = session หมดอายุจริง
    const hasToken = !!localStorage.getItem("pb_token");
    const isAuthRequest = reqUrl.includes("/auth/login") || reqUrl.includes("/auth/register");

    if (status === 401 && hasToken && !isAuthRequest) {
      window.dispatchEvent(new Event("pb:session-expired"));
    }
    // ถ้าเป็น 401 จาก login (email/รหัสผิด) → ไม่ยิง event, ให้ LoginPage จัดการเอง

    return Promise.reject(error);
  }
);