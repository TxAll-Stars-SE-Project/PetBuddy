import { useEffect, useState } from "react";
import { getPaymentSummary } from "../services/bookings.js";
import { toast } from "../utils/toast.js";

const STAGE_LABEL = { deposit: "มัดจำ", final: "ยอดคงเหลือ", full: "เต็มจำนวน" };
const STATUS_LABEL = { pending_verifying: "รอตรวจสอบ", verified: "ยืนยันแล้ว", rejected: "ถูกปฏิเสธ" };

function formatBaht(amount) {
  return `฿${Number(amount).toLocaleString("th-TH")}`;
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// งวดที่ต้องจ่ายตอนนี้: หลังจบงาน = ยอดคงเหลือ, ก่อนเริ่มงาน = มัดจำ หรือเต็มจำนวน
function getDueStage(summary) {
  if (summary.bookingstatus === "waiting_final_payment") return "final";
  return summary.paymentplan === "deposit" ? "deposit" : "full";
}

function getErrorMessage(err) {
  const status = err.response?.status;
  if (status === 403) return "คุณไม่มีสิทธิ์ดูข้อมูลการชำระเงินของการจองนี้";
  if (status === 404) return "ไม่พบการจองนี้";
  return "โหลดสรุปยอดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}

// PaymentModal — สรุปยอดที่ต้องจ่าย (US6-1) จาก GET /api/bookings/{id}/payments
// การแนบสลิป (POST /api/payments) เป็นงานของ US6-2
export default function PaymentModal({ booking, onClose }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ status: "loading", summary: null, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    setResult({ status: "loading", summary: null, error: "" });
    getPaymentSummary(booking.bookingId, { signal: controller.signal })
      .then((summary) => setResult({ status: "success", summary, error: "" }))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResult({ status: "error", summary: null, error: getErrorMessage(err) });
      });
    return () => controller.abort();
  }, [booking.bookingId, reloadKey]);

  const { status, summary, error } = result;

  const handleAttachSlip = () => {
    toast("แนบสลิปการโอนเงินจะเปิดใช้งานใน US6-2", "info");
  };

  // ส่งสลิปงวดนี้ไปแล้วและรอพี่เลี้ยงตรวจ → ไม่ต้องแนบซ้ำ
  const dueStage = summary ? getDueStage(summary) : null;
  const payments = summary?.payments ?? [];
  const isVerifying = payments.some((p) => p.payment_stage === dueStage && p.payment_status === "pending_verifying");
  const canAttach = status === "success" && !isVerifying;

  let body;
  if (status === "loading") {
    body = <p className="payment-modal-state">กำลังโหลดสรุปยอด…</p>;
  } else if (status === "error") {
    body = (
      <div className="payment-modal-state payment-modal-state--error">
        <p>{error}</p>
        <button type="button" className="btn btn--small" onClick={() => setReloadKey((k) => k + 1)}>
          ลองใหม่
        </button>
      </div>
    );
  } else {
    const isDeposit = summary.paymentplan === "deposit";
    const amountDueNow = { deposit: summary.depositAmount, final: summary.remainingAmount, full: summary.totalPrice }[dueStage];

    body = (
      <>
        <div className="payment-breakdown">
          <div className="payment-row">
            <span>ราคารวม</span>
            <span>{formatBaht(summary.totalPrice)}</span>
          </div>
          <div className="payment-row">
            <span>รูปแบบการชำระ</span>
            <span className="payment-plan-tag">
              {isDeposit ? "มัดจำ + ชำระส่วนที่เหลือภายหลัง" : "ชำระเต็มจำนวน"}
            </span>
          </div>
          {isDeposit && (
            <>
              <div className="payment-row">
                <span>ยอดมัดจำ</span>
                <span>{formatBaht(summary.depositAmount)}</span>
              </div>
              <div className="payment-row">
                <span>ยอดคงเหลือ</span>
                <span>{formatBaht(summary.remainingAmount)}</span>
              </div>
            </>
          )}
          <div className="payment-row payment-row--total">
            <span>ยอดที่ต้องชำระตอนนี้</span>
            <span>{formatBaht(amountDueNow)}</span>
          </div>
        </div>

        {isVerifying && (
          <p className="payment-modal-note">ส่งสลิปงวดนี้แล้ว กำลังรอพี่เลี้ยงตรวจสอบ</p>
        )}

        {payments.length > 0 && (
          <div className="payment-history">
            <div className="row-label">ประวัติการชำระเงิน</div>
            {payments.map((p) => (
              <div key={p.paymentId} className="payment-history-row">
                <span>{STAGE_LABEL[p.payment_stage] ?? p.payment_stage}</span>
                <span>{formatBaht(p.amount)}</span>
                <span className={`payment-status payment-status--${p.payment_status}`}>
                  {STATUS_LABEL[p.payment_status] ?? p.payment_status}
                </span>
                {p.paid_at && <span className="payment-history-date">{formatDateTime(p.paid_at)}</span>}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal payment-modal" onClick={(e) => e.stopPropagation()}>
        <h2>สรุปยอดชำระเงิน</h2>
        <p className="payment-modal-sub">
          การจอง #{booking.bookingId} · {booking.sitterName} · {booking.serviceName}
        </p>

        {body}

        <div className="delete-modal-actions" style={{ marginTop: "24px" }}>
          <button type="button" className="delete-cancel-button" onClick={onClose}>
            ปิด
          </button>
          <button type="button" className="profile-save-button" onClick={handleAttachSlip} disabled={!canAttach}>
            แนบสลิปการโอนเงิน
          </button>
        </div>
      </div>
    </div>
  );
}
