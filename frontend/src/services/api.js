// src/services/api.js
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// 👇 1. ดึง Hardcoded Key ออกมาเป็น Constant ตามคำแนะนำ
const TOKEN_KEY = "pb_token"; 

export class ApiError extends Error {
  constructor(status, data) {
    super((data && (data.error || data.message)) || "UNKNOWN_ERROR");
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth) {
    window.dispatchEvent(new Event("pb:session-expired"));
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

// 👇 2. เพิ่ม HTTP Methods อื่นๆ ให้ครบถ้วน (รองรับ Sprint 2)
export const api = {
  get:    (path, opts) => request(path, { method: "GET", ...opts }),
  post:   (path, body, opts) => request(path, { method: "POST", body, ...opts }),
  put:    (path, body, opts) => request(path, { method: "PUT", body, ...opts }),
  patch:  (path, body, opts) => request(path, { method: "PATCH", body, ...opts }),
  delete: (path, opts) => request(path, { method: "DELETE", ...opts }),
};