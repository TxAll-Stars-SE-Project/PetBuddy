// src/services/sitters.js — ค้นหาพี่เลี้ยง (GET /api/sitters, public)
import { api } from "./api.js";

// แปลง state ของตัวกรองในหน้า → query params ของ API (ไม่ส่งค่าว่าง)
export function buildSitterParams(filters) {
  const map = {
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

export async function searchSitters(filters, { signal } = {}) {
  const res = await api.get("/sitters", { params: buildSitterParams(filters), signal });
  return res.data.data;
}
