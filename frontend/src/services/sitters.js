// src/services/sitters.js — ค้นหาพี่เลี้ยง (GET /api/sitters, public)
import { api } from "./api.js";

// แปลง state ของตัวกรองในหน้า → query params ของ API (ไม่ส่งค่าว่าง)
export function buildSitterParams(filters) {
  const map = {
    q: "q",
    province: "province",
    district: "district",
    pet: "petType",
    service: "category",
    min: "minPrice",
    max: "maxPrice",
    rating: "minRating",
    sort: "sort",
  };
  const params = {};
  for (const [key, param] of Object.entries(map)) {
    const value = filters[key];
    if (value !== "" && value !== 0 && value != null) params[param] = value;
  }
  return params;
}

export const PAGE_SIZE = 12;

// คืน { sitters, pagination: { page, limit, total, totalPages } }
export async function searchSitters(filters, page = 1, { signal } = {}) {
  const params = { ...buildSitterParams(filters), page, limit: PAGE_SIZE };
  const res = await api.get("/sitters", { params, signal });
  return { sitters: res.data.data, pagination: res.data.pagination };
}

// 👈 เติม 2 ฟังก์ชันนี้เพื่อให้ BookingModal เรียกใช้ได้
export async function getSitterServices(sitterId) {
  const res = await api.get(`/sitters/${sitterId}/services`);
  return res.data?.data || res.data;
}

export async function getSitterBusySlots(sitterId, date) {
  const res = await api.get(`/sitters/${sitterId}/busy-slots`, { params: { date } });
  return res.data?.data || res.data;
}