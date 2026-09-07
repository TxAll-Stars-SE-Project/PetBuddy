// src/services/api.js — ฉบับต่อ backend จริง
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export class ApiError extends Error {
  constructor(status, data) {
    super((data && (data.error || data.message)) || "UNKNOWN_ERROR");
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const token = localStorage.getItem("pb_token");
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // 401 กลางทาง → เด้งออก + banner session หมดอายุ
  if (res.status === 401 && auth) {
    window.dispatchEvent(new Event("pb:session-expired"));
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  post: (path, body, opts) => request(path, { method: "POST", body, ...opts }),
  get: (path, opts) => request(path, { method: "GET", ...opts }),
};