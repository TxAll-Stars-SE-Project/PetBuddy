// frontend/src/utils/reviewStorage.js
// จัดการสถานะการรีวิว (Review) ของการจองฝั่ง Frontend ผ่าน localStorage

const STORAGE_KEY = 'pb_booking_reviews';
export const REVIEW_WINDOW_DAYS = 14; // ระยะเวลารับรีวิว 14 วัน
export const REVIEW_WINDOW_MS = REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
export const SEVEN_DAYS_MS = REVIEW_WINDOW_MS; // alias เพื่อ backward compatibility

/**
 * ดึงรายการรีวิวทั้งหมดที่บันทึกไว้ใน localStorage
 * @returns {Record<string, { bookingId: number, rating: number, comment: string, reviewedAt: string, status: string }>}
 */
export function getSavedReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to parse saved reviews from localStorage', err);
    return {};
  }
}

/**
 * บันทึกรีวิวสำหรับการจอง (bookingId)
 * @param {number|string} bookingId
 * @param {{ rating: number, comment?: string, sitterName?: string, serviceName?: string }} payload
 */
export function saveBookingReview(bookingId, payload) {
  try {
    const current = getSavedReviews();
    const reviewData = {
      bookingId: Number(bookingId),
      rating: Number(payload.rating) || 5,
      comment: payload.comment?.trim() || '',
      sitterName: payload.sitterName || '',
      serviceName: payload.serviceName || '',
      reviewedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      reviewId: payload.reviewId,
      status: 'reviewed', // สถานะ: รีวิวเรียบร้อยแล้ว
    };
    current[bookingId] = reviewData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return reviewData;
  } catch (err) {
    console.error('Failed to save review to localStorage', err);
    return null;
  }
}

/**
 * คำนวณและตรวจสอบสถานะการรีวิวของการจอง
 * 
 * สถานะที่เป็นไปได้ (State):
 * 1. 'pending_review' -> งานจบแล้ว ยังไม่ได้รีวิว และยังไม่เกิน 14 วัน (แสดงปุ่มรีวิว)
 * 2. 'reviewed' -> รีวิวแล้ว (แสดงป้ายรีวิวแล้ว พร้อมคลิกดูรีวิวเดิมได้)
 * 3. 'expired_auto_reviewed' -> ผ่านไป 14 วันแล้วไม่ได้รีวิว (หมดเวลารีวิว)
 * 4. 'not_completed' -> งานยังไม่เสร็จสิ้น (ไม่มีปุ่มรีวิว)
 * 
 * @param {Object} booking
 * @param {Record<string, any>} [savedReviews]
 * @returns {{ state: 'pending_review'|'reviewed'|'expired_auto_reviewed'|'not_completed', canReview: boolean, rating?: number, comment?: string, reviewedAt?: string, daysRemaining?: number, isUrgent?: boolean, isExpired?: boolean }}
 */
export function getBookingReviewState(booking, savedReviews = null) {
  if (!booking || booking.bookingstatus !== 'completed') {
    return { state: 'not_completed', canReview: false };
  }

  // 1. ถ้ามีข้อมูลรีวิวจาก Server โดยตรง (booking.review จาก GET /api/owner/bookings)
  if (booking.review && (booking.review.reviewId || typeof booking.review.rating === 'number')) {
    return {
      state: 'reviewed',
      canReview: false,
      rating: booking.review.rating,
      comment: booking.review.comment ?? '',
      reviewId: booking.review.reviewId,
    };
  }

  // 2. ถ้ามีบันทึกใน localStorage (fallback / optimistic cache)
  const reviews = savedReviews || getSavedReviews();
  const reviewRecord = reviews[booking.bookingId];
  if (reviewRecord && reviewRecord.status === 'reviewed') {
    return {
      state: 'reviewed',
      canReview: false,
      rating: reviewRecord.rating,
      comment: reviewRecord.comment,
      reviewedAt: reviewRecord.reviewedAt,
      reviewId: reviewRecord.reviewId,
    };
  }

  // 3. ตรวจสอบเงื่อนไขระยะเวลา 14 วัน นับจาก endtime (รองรับทั้ง endtime, endTime, end_time)
  const now = Date.now();
  const rawEndTime = booking.endtime || booking.endTime || booking.end_time;
  const endTime = rawEndTime ? new Date(rawEndTime).getTime() : NaN;
  const isValidDate = !Number.isNaN(endTime);

  // ถ้าเวลาผ่านไปเกิน 14 วัน
  if (isValidDate && now - endTime > REVIEW_WINDOW_MS) {
    return {
      state: 'expired_auto_reviewed', // หมดระยะเวลารีวิว (เกิน 14 วัน)
      canReview: false,
      isExpired: true,
    };
  }

  // 4. ยังไม่เกิน 14 วัน และยังไม่ได้รีวิว -> สามารถกดรีวิวได้
  const msRemaining = isValidDate ? Math.max(0, endTime + REVIEW_WINDOW_MS - now) : REVIEW_WINDOW_MS;
  const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

  return {
    state: 'pending_review',
    canReview: true,
    daysRemaining,
    isUrgent: daysRemaining <= 2,
  };
}
