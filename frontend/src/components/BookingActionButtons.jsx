// frontend/src/components/BookingActionButtons.jsx
import React, { useState } from "react";
import { cancelBooking } from "../services/bookings.js";
import { updateBookingStatus } from "../services/booking.api";
import { toast } from "../utils/toast";
import { getBookingStatusInfo } from "../utils/bookingStatusConfig.js";

export default function BookingActionButtons({
  booking,
  role = "sitter", // 'sitter' | 'owner'
  hasPaymentInfo = true, // สำหรับ Sitter ตรวจสอบ QR Code (US2-2)
  onStatusChange,
  onOpenPaymentModal,
  onOpenReportModal,
  onOpenReviewModal,
}) {
  const [loading, setLoading] = useState(false);

  const bookingId = booking?.bookingId;
  const status = booking?.bookingstatus;
  const paymentPlan = booking?.paymentplan || "deposit";

  const statusInfo = getBookingStatusInfo(status);
  const actions = statusInfo.allowedActions[role] || [];

  // Sitter Action: เรียกใช้ updateBookingStatus จาก booking.api.ts
  const handleSitterAction = async (action) => {
    // US2-2 & US6-2 Validation Check
    if (action === "accept" && hasPaymentInfo === false) {
      toast("กรุณาตั้งค่าชื่อบัญชีรับเงินและอัปโหลด QR Code ในหน้าโปรไฟล์ก่อนกดรับงาน", "error");
      return;
    }

    const actionText =
      action === "accept"
        ? "รับงานคำขอจองเรียบร้อยแล้ว (สถานะ: รอชำระเงิน)"
        : action === "reject"
        ? "ปฏิเสธคำขอจองเรียบร้อยแล้ว"
        : "ส่งมอบงานเสร็จสิ้นเรียบร้อยแล้ว";

    setLoading(true);
    try {
      await updateBookingStatus(bookingId, action);
      toast(actionText, "success");
      if (onStatusChange) onStatusChange();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "ไม่สามารถอัปเดตสถานะการจองได้";
      toast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Owner Action: เรียกใช้ cancelBooking จาก bookings.js
  const handleOwnerCancel = async () => {
    if (!window.confirm("คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?")) return;

    setLoading(true);
    try {
      await cancelBooking(bookingId);
      toast("ยกเลิกการจองเรียบร้อยแล้ว", "success");
      if (onStatusChange) onStatusChange();
    } catch (err) {
      const errorMsg =
        err.response?.status === 409
          ? "ไม่สามารถยกเลิกได้ในสถานะนี้"
          : err.response?.data?.message || "ยกเลิกการจองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
      toast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (actions.length === 0) return null;

  return (
    <div className="booking-actions">
      {/* ---------------- Sitter Actions ---------------- */}
      {role === "sitter" && (
        <>
          {actions.includes("accept") && (
            <button
              type="button"
              onClick={() => handleSitterAction("accept")}
              disabled={loading}
              className="btn btn--small"
            >
              {loading ? "กำลังบันทึก..." : "ยอมรับการจอง"}
            </button>
          )}

          {actions.includes("reject") && (
            <button
              type="button"
              onClick={() => handleSitterAction("reject")}
              disabled={loading}
              className="btn btn--small btn--danger-outline"
            >
              {loading ? "กำลังบันทึก..." : "ปฏิเสธ"}
            </button>
          )}

          {actions.includes("send_report") && (
            <button
              type="button"
              onClick={() => onOpenReportModal && onOpenReportModal(booking)}
              disabled={loading}
              className="btn btn--small btn--secondary"
            >
              ส่ง Care Report
            </button>
          )}

          {actions.includes("complete") && (
            <button
              type="button"
              onClick={() => handleSitterAction("complete")}
              disabled={loading}
              className="btn btn--small"
            >
              {loading
                ? "กำลังบันทึก..."
                : paymentPlan === "full"
                ? "จบการทำงาน"
                : "จบการทำงาน (รอรับ 70%)"}
            </button>
          )}
        </>
      )}

      {/* ---------------- Owner Actions ---------------- */}
      {role === "owner" && (
        <>
          {actions.includes("cancel") && (
            <button
              type="button"
              onClick={handleOwnerCancel}
              disabled={loading}
              className="btn btn--small btn--danger-outline"
            >
              {loading ? "กำลังยกเลิก..." : "ยกเลิกการจอง"}
            </button>
          )}

          {(actions.includes("pay") || actions.includes("pay_final")) && (
            <button
              type="button"
              onClick={() => onOpenPaymentModal && onOpenPaymentModal(booking)}
              className="btn btn--small"
            >
              {actions.includes("pay_final") ? "ชำระส่วนที่เหลือ (70%)" : "ชำระเงิน"}
            </button>
          )}

          {actions.includes("review") && (
            <button
              type="button"
              onClick={() => onOpenReviewModal && onOpenReviewModal(booking)}
              className="btn btn--small btn--secondary"
            >
              เขียนรีวิว
            </button>
          )}
        </>
      )}
    </div>
  );
}