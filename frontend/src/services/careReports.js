// frontend/src/services/careReports.js
import { api } from "./api.js";

/**
 * ดึงรายงานการดูแลทั้งหมดของการจอง (docs/API.md § PART 3: 6.2 US 7-3)
 * GET /api/bookings/{bookingID}/reports — ใช้ได้ทั้ง owner และ sitter ของการจองนั้น
 *
 * @param {number|string} bookingId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Array<{ reportId: number, bookingId: number, reportDetail: string, photoUrl: string|null, createdAt: string }>>}
 */
export async function getCareReports(bookingId, { signal } = {}) {
  const res = await api.get(`/bookings/${bookingId}/reports`, { signal });
  const data = res.data?.data ?? res.data;
  return Array.isArray(data) ? data : [];
}

/**
 * พี่เลี้ยงส่งรายงานการดูแล + รูปถ่าย (ไม่บังคับ) ระหว่างให้บริการ (docs/API.md § PART 3: 6.1 US 7-3)
 * POST /api/bookings/{bookingID}/reports — ส่งได้เฉพาะตอนสถานะ in_progress
 *
 * @param {number|string} bookingId
 * @param {{ reportDetail: string, photo?: File|null }} payload
 */
export async function createCareReport(bookingId, { reportDetail, photo }) {
  const formData = new FormData();
  formData.append("reportDetail", reportDetail);
  if (photo) formData.append("photo", photo);

  const res = await api.post(`/bookings/${bookingId}/reports`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data ?? res.data;
}

// แปลง error code จาก backend เป็นข้อความภาษาไทยสำหรับแสดงในฟอร์ม
const CARE_REPORT_ERROR_MESSAGES = {
  REPORT_DETAIL_REQUIRED: "กรุณาเขียนบันทึกกิจกรรมอย่างน้อย 1 ข้อความ",
  REPORT_DETAIL_TOO_LONG: "บันทึกกิจกรรมต้องไม่เกิน 1000 ตัวอักษร",
  INVALID_PHOTO: "รูปไม่ถูกต้อง รองรับเฉพาะ JPG, PNG หรือ WebP ขนาดไม่เกิน 5MB",
  INVALID_FORM_DATA: "ข้อมูลที่ส่งไม่ครบถ้วน กรุณาลองใหม่อีกครั้ง",
  BOOKING_NOT_IN_PROGRESS: "ส่งรายงานได้เฉพาะระหว่างที่กำลังให้บริการเท่านั้น",
  FORBIDDEN: "คุณไม่ใช่พี่เลี้ยงของการจองนี้",
  BOOKING_NOT_FOUND: "ไม่พบการจองนี้",
};

export function getCareReportErrorMessage(err, fallback = "ส่งรายงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง") {
  const code = err?.response?.data?.error;
  return CARE_REPORT_ERROR_MESSAGES[code] || fallback;
}
