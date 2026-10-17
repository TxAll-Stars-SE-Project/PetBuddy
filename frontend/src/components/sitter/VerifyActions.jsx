import "./VerifyPaymentModal.css";

export default function VerifyActions({ onVerify, onReject, loading }) {
  return (
    <footer className="verify-payment-modal__actions">
      <button
        className="verify-payment-modal__button verify-payment-modal__button--reject"
        type="button"
        onClick={onReject}
        disabled={loading}
      >
        ปฏิเสธสลิป
      </button>
      <button
        className="verify-payment-modal__button verify-payment-modal__button--verify"
        type="button"
        onClick={onVerify}
        disabled={loading}
      >
        {loading ? "กำลังดำเนินการ..." : "ยืนยันการชำระเงิน"}
      </button>
    </footer>
  );
}
