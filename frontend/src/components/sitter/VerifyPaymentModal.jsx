import { useEffect, useState } from "react";
import { verifyPayment } from "../../services/payment.api.js";
import { toast } from "../../utils/toast.js";
import SlipImageViewer from "./SlipImageViewer.jsx";
import VerifyActions from "./VerifyActions.jsx";
import "./VerifyPaymentModal.css";

const STAGE_LABELS = {
  deposit: "มัดจำ",
  full: "เต็มจำนวน",
  final: "ยอดคงเหลือ",
};

function formatAmount(amount) {
  return `${Number(amount || 0).toLocaleString("th-TH")} บาท`;
}

function formatPaidAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function VerifyPaymentModal({
  isOpen,
  onClose,
  booking,
  paymentData,
  onVerified,
}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !booking || !paymentData) return null;

  const handleAction = async (action) => {
    if (loading) return;

    setLoading(true);
    try {
      await verifyPayment(booking.bookingId, paymentData.paymentId, action);
    } catch (error) {
      toast(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการตรวจสอบสลิป",
        "error",
      );
      return;
    } finally {
      setLoading(false);
    }

    if (action === "verify") {
      toast("ยืนยันการชำระเงินเรียบร้อยแล้ว การจองได้รับการยืนยัน", "success");
    } else {
      toast("ปฏิเสธสลิปการโอนเงินเรียบร้อยแล้ว", "info");
    }
    onClose();
    onVerified();
  };

  const stage = STAGE_LABELS[paymentData.payment_stage] || paymentData.payment_stage || "-";

  return (
    <div
      className="verify-payment-modal__overlay"
      role="presentation"
      onClick={loading ? undefined : onClose}
    >
      <section
        className="verify-payment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-payment-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="verify-payment-modal__header">
          <div>
            <h2 id="verify-payment-modal-title">ตรวจสอบสลิปการโอนเงิน</h2>
            <p>การจอง #{booking.bookingId}</p>
          </div>
          <button
            className="verify-payment-modal__close"
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="ปิดหน้าต่าง"
          >
            ×
          </button>
        </header>

        <div className="verify-payment-modal__body">
          <dl className="verify-payment-modal__details">
            <div>
              <dt>ยอดเงินที่โอน</dt>
              <dd>{formatAmount(paymentData.amount)}</dd>
            </div>
            <div>
              <dt>รอบการชำระ</dt>
              <dd>{stage}</dd>
            </div>
            <div>
              <dt>วันเวลาที่โอน</dt>
              <dd>{formatPaidAt(paymentData.paid_at)}</dd>
            </div>
          </dl>
          <SlipImageViewer imageUrl={paymentData.slip_image} />
        </div>

        <VerifyActions
          onVerify={() => void handleAction("verify")}
          onReject={() => void handleAction("reject")}
          loading={loading}
        />
      </section>
    </div>
  );
}
