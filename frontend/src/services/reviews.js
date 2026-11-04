// frontend/src/services/reviews.js
import { api } from "./api.js";

/**
 * เจ้าของสัตว์เลี้ยงส่งรีวิวและให้คะแนน 1-5 ดาว (docs/API.md § 7.1 US 7-1)
 * POST /api/reviews
 *
 * @param {Object} payload
 * @param {number} payload.bookingId - รหัสการจอง (integer)
 * @param {number} payload.rating - คะแนนดาว 1 - 5 (integer)
 * @param {string} [payload.comment] - ความคิดเห็นเพิ่มเติม
 * @returns {Promise<{ reviewId: number, bookingId: number, rating: number, comment: string }>}
 */
export async function createBookingReview({ bookingId, rating, comment }) {
  const payload = {
    bookingId: Number(bookingId),
    rating: Number(rating),
    comment: comment?.trim() || "",
  };

  const res = await api.post("/reviews", payload);
  return res.data?.data || res.data;
}

/**
 * ดึงรายการรีวิวทั้งหมดของพี่เลี้ยง (docs/API.md § 7.2)
 * GET /api/sitters/{sitterID}/reviews
 *
 * @param {number|string} sitterId
 * @returns {Promise<{ sitterId: number, averageRating: number, reviewCount: number, reviews: Array }>}
 */
export async function getSitterReviews(sitterId) {
  const res = await api.get(`/sitters/${sitterId}/reviews`);
  return res.data?.data || res.data;
}
