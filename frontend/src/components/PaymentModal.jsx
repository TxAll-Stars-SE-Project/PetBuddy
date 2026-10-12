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

// Design: PaymentModal — สรุปยอดที่ต้องจ่าย (US6-1)
// ยังไม่ต่อ POST /api/payments จริง (เป็นงานของ US6-2 แนบสลิปการโอนเงิน)
export default function PaymentModal({ booking, summary, onClose }) {
  if (!summary) return null;

  const isDeposit = summary.paymentplan === "deposit";
  const amountDueNow = summary.bookingstatus === "waiting_final_payment"
    ? summary.remainingAmount
    : summary.depositAmount;

  const handleAttachSlip = () => {
    toast("แนบสลิปการโอนเงินจะเปิดใช้งานใน US6-2", "info");
  };

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal payment-modal" onClick={(e) => e.stopPropagation()}>
        <h2>สรุปยอดชำระเงิน</h2>
        <p className="payment-modal-sub">
          การจอง #{booking.bookingId} · {booking.sitterName} · {booking.serviceName}
        </p>

        <div className="payment-breakdown">
          <div className="payment-row">
            <span>ราคารวม</span>
            <span>{formatBaht(summary.totalPrice)}</span>
          </div>
          <div className="payment-row">
            <span>รูปแบบการชำระ</span>
            <span className="payment-plan-tag">
              {isDeposit ? "มัดจำ 30% + ชำระส่วนที่เหลือภายหลัง" : "ชำระเต็มจำนวน"}
            </span>
          </div>
          {isDeposit && (
            <>
              <div className="payment-row">
                <span>ยอดมัดจำ (30%)</span>
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

        {summary.payments.length > 0 && (
          <div className="payment-history">
            <div className="row-label">ประวัติการชำระเงิน</div>
            {summary.payments.map((p) => (
              <div key={p.paymentId} className="payment-history-row">
                <span>{STAGE_LABEL[p.payment_stage] ?? p.payment_stage}</span>
                <span>{formatBaht(p.amount)}</span>
                <span className={`payment-status payment-status--${p.payment_status}`}>
                  {STATUS_LABEL[p.payment_status] ?? p.payment_status}
                </span>
                <span className="payment-history-date">{formatDateTime(p.paid_at)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="delete-modal-actions" style={{ marginTop: "24px" }}>
          <button type="button" className="delete-cancel-button" onClick={onClose}>
            ปิด
          </button>
          <button type="button" className="profile-save-button" onClick={handleAttachSlip}>
            แนบสลิปการโอนเงิน
          </button>
        </div>
      </div>
    </div>
  );
}
