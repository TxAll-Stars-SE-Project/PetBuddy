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

// Interceptor: จัดการ 401 กลางทาง (session หมดอายุ)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event("pb:session-expired"));
    }
    return Promise.reject(error);
  }
);