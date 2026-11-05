import React, { useState, useEffect } from "react";
import { saveBookingReview } from "../utils/reviewStorage.js";
import { createBookingReview } from "../services/reviews.js";
import { toast } from "../utils/toast.js";

const RATING_LABELS = {
  1: "ต้องปรับปรุง (1/5)",
  2: "พอใช้ (2/5)",
  3: "ปานกลาง (3/5)",
  4: "ดีมาก (4/5)",
  5: "ยอดเยี่ยม ประทับใจมาก (5/5)",
};

/**
 * ReviewModal Component
 * 
 * หน้าต่าง Modal สำหรับให้เจ้าของสัตว์เลี้ยง:
 * 1. ส่งคะแนน (1-5 ดาว) และข้อความรีวิว (โหมดเขียนรีวิว)
 * 2. เปิดดูรีวิวของตัวเองที่เคยส่งไปแล้วย้อนหลัง (โหมดอ่านอย่างเดียว - View Mode)
 * 
 * @param {Object} props
 * @param {Object} props.booking - ข้อมูลการจองที่ต้องการรีวิว
 * @param {Object} [props.existingReview] - รีวิวเดิมที่เคยส่งไว้แล้ว (ถ้ามี)
 * @param {boolean} props.isOpen - สถานะการเปิด/ปิด Modal
 * @param {Function} props.onClose - ฟังก์ชันปิด Modal
 * @param {Function} props.onSubmitSuccess - ฟังก์ชัน Callback เมื่อส่งรีวิวสำเร็จ
 */
export default function ReviewModal({
  booking,
  existingReview = null,
  isOpen = false,
  onClose,
  onSubmitSuccess,
}) {
  const isViewMode = Boolean(existingReview && (existingReview.rating || existingReview.status === "reviewed"));

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // รองรับการกดแป้น Escape เพื่อปิด Modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  // รีเซ็ตค่าเมื่อเปิด Modal ใหม่
  useEffect(() => {
    if (isOpen) {
      if (isViewMode && existingReview) {
        setRating(Number(existingReview.rating) || 5);
        setComment(existingReview.comment || "");
      } else {
        setRating(5);
        setHoverRating(0);
        setComment("");
      }
      setIsSubmitting(false);
    }
  }, [isOpen, booking?.bookingId, isViewMode, existingReview]);

  if (!isOpen || !booking) return null;

  const currentScore = isViewMode ? (Number(existingReview?.rating) || 5) : (hoverRating || rating);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewMode) {
      if (onClose) onClose();
      return;
    }

    setIsSubmitting(true);

    try {
      // ยิง POST /api/reviews ตาม docs/API.md § 7.1 (US 7-1)
      const apiResult = await createBookingReview({
        bookingId: booking.bookingId,
        rating,
        comment,
      });

      // แคชผลลัพธ์ลง local cache เพื่อให้ UI อัปเดตทันที
      const saved = saveBookingReview(booking.bookingId, {
        rating,
        comment,
        sitterName: booking.sitterName,
        serviceName: booking.serviceName,
        reviewId: apiResult?.reviewId,
      });

      toast("ส่งรีวิวเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็นของคุณ!", "success");

      if (onSubmitSuccess) {
        onSubmitSuccess(saved || apiResult);
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Submit review error:", err);
      const message =
        err.response?.data?.message || "เกิดข้อผิดพลาดในการส่งรีวิว กรุณาลองใหม่อีกครั้ง";
      toast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="delete-modal-overlay"
      onClick={() => !isSubmitting && onClose && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div
        className="delete-modal review-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="review-modal-header">
          <div className="review-header-badge">
            {isViewMode ? "⭐ รีวิวของคุณ" : "⭐ รีวิวและให้คะแนน"}
          </div>
          <h2 id="review-modal-title" className="review-title">
            {isViewMode ? "รีวิวที่คุณส่งแล้ว" : "ให้คะแนนการบริการ"}
          </h2>
          <p className="review-subtitle">
            {isViewMode
              ? "ขอบคุณที่ช่วยแชร์ความคิดเห็นเพื่อเป็นประโยชน์ต่อผู้ใช้ท่านอื่นและพี่เลี้ยง"
              : "ความเห็นของคุณช่วยให้พี่เลี้ยงพัฒนาบริการและช่วยให้ผู้ใช้อื่นตัดสินใจได้ดียิ่งขึ้น"}
          </p>
        </div>

        {/* ข้อมูลการจองโดยสังเขป */}
        <div className="review-booking-summary">
          <div className="review-summary-row">
            <span className="review-summary-tag">การจอง #{booking.bookingId}</span>
            <span className="review-summary-status">เสร็จสิ้น</span>
          </div>
          <div className="review-summary-details">
            <p><strong>พี่เลี้ยง:</strong> {booking.sitterName || "พี่เลี้ยงสัตว์เลี้ยง"}</p>
            <p><strong>บริการ:</strong> {booking.serviceName || "บริการดูแลสัตว์เลี้ยง"}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          {/* ส่วนเลือกคะแนนดาว (Star Rating Selector) */}
          <div className="review-rating-section">
            <label className="review-section-label">
              {isViewMode ? "คะแนนที่คุณให้" : "คะแนนความพึงพอใจ"}
            </label>
            <div
              className={`review-stars-group ${isViewMode ? "review-stars-group--readonly" : ""}`}
              role="radiogroup"
              aria-label={isViewMode ? "คะแนนที่คุณให้" : "คะแนนความพึงพอใจ"}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={star === rating}
                  className={`review-star-btn ${star <= currentScore ? "is-active" : ""}`}
                  onClick={() => !isViewMode && setRating(star)}
                  onMouseEnter={() => !isViewMode && setHoverRating(star)}
                  onMouseLeave={() => !isViewMode && setHoverRating(0)}
                  aria-label={`${star} ดาว`}
                  disabled={isViewMode}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="review-score-label">
              {RATING_LABELS[currentScore] || `${currentScore} ดาว`}
            </div>
          </div>

          {/* ส่วนข้อความรีวิว */}
          {isViewMode ? (
            <div className="review-comment-section">
              <label className="review-section-label">ความคิดเห็นของคุณ</label>
              <div className="review-view-comment-box">
                {existingReview?.comment ? (
                  <p className="review-view-comment-text">“{existingReview.comment}”</p>
                ) : (
                  <p className="review-view-comment-empty">(ไม่มีข้อความรีวิวเพิ่มเติม)</p>
                )}
              </div>
              {existingReview?.reviewedAt && (
                <div className="review-reviewed-at">
                  🗓️ ส่งรีวิวเมื่อ: {new Date(existingReview.reviewedAt).toLocaleString("th-TH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })} น.
                </div>
              )}
            </div>
          ) : (
            <div className="review-comment-section">
              <div className="review-comment-header">
                <label htmlFor="review-comment" className="review-section-label">
                  ความคิดเห็นเพิ่มเติม (ไม่บังคับ)
                </label>
                <span className="review-char-count">{comment.length}/200</span>
              </div>
              <textarea
                id="review-comment"
                className="review-textarea"
                rows={3}
                maxLength={200}
                placeholder="บอกเล่าความประทับใจ เช่น การดูแลน้องสัตว์เลี้ยง ความใส่ใจ ความตรงต่อเวลา..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* หมายเหตุเงื่อนไข 14 วัน (เฉพาะโหมดเขียนรีวิว) */}
          {!isViewMode && (
            <div className="review-rule-notice">
              <span>⏳</span>
              <span>
                <strong>เงื่อนไขการรีวิว:</strong> คุณสามารถเขียนรีวิวได้ภายใน 14 วันหลังเสร็จสิ้นบริการ หากเกินกำหนดระบบจะปิดรับรีวิวอัตโนมัติ
              </span>
            </div>
          )}

          {/* ปุ่มการทำงาน */}
          <div className="delete-modal-actions review-modal-actions">
            {isViewMode ? (
              <button
                type="button"
                className="profile-save-button review-submit-button"
                onClick={onClose}
                style={{ width: "100%" }}
              >
                ปิดหน้าต่าง
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="delete-cancel-button"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="profile-save-button review-submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "กำลังส่งรีวิว..." : "ส่งรีวิว"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
