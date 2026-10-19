// src/services/bookings.js — การจองฝั่งเจ้าของสัตว์เลี้ยง + สรุปยอดชำระ (docs/API.md § 2.3, § 3.1)
import { api } from "./api.js";

// GET /api/owner/bookings — status ว่าง = ทุกสถานะ
export async function getOwnerBookings(status, { signal } = {}) {
  const params = status ? { status } : {};
  const res = await api.get("/owner/bookings", { params, signal });
  return res.data.data;
}

// GET /api/bookings/{bookingID}/payments
export async function getPaymentSummary(bookingId, { signal } = {}) {
  const res = await api.get(`/bookings/${bookingId}/payments`, { signal });
  return res.data.data;
}
