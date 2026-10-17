const STAGE_LABEL = { deposit: "มัดจำ", final: "ยอดคงเหลือ", full: "เต็มจำนวน" };
const STATUS_LABEL = { pending_verifying: "รอตรวจสอบ", verified: "ยืนยันแล้ว", rejected: "ถูกปฏิเสธ" };

function formatBaht(amount) {
  return `฿${Number(amount || 0).toLocaleString("th-TH")}`;
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

export default function PaymentSummary({ summary, booking, isError }) {
  if (!summary) return null;

  const isDeposit = summary.paymentplan === "deposit";
  const hasPendingPayment = summary.payments?.some(
    (payment) => payment.payment_status === "pending_verifying",
  );
  const amountDueNow = summary.payment_stage === "full"
    ? summary.totalPrice
    : summary.bookingstatus === "waiting_final_payment"
      ? summary.remainingAmount
      : isDeposit
        ? summary.depositAmount
        : summary.totalPrice;

  return (
    <section className="payment-summary" aria-label="สรุปยอดชำระเงิน">
      {isError && (
        <div className="payment-fallback-banner" role="status">
          ไม่สามารถโหลดรายละเอียดการชำระเงินได้ กำลังใช้ยอดจากข้อมูลการจองแทน
        </div>
      )}
      {hasPendingPayment && (
        <div className="payment-pending-banner" role="status">
          สลิปอยู่ระหว่างรอพี่เลี้ยงตรวจสอบ
        </div>
      )}
      <p className="payment-summary-booking">
        {booking?.sitterName ? `${booking.sitterName} · ` : ""}
        {booking?.serviceName || ""}
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

      {summary.payments?.length > 0 && (
        <div className="payment-history">
          <div className="row-label">ประวัติการชำระเงิน</div>
          {summary.payments.map((payment) => (
            <div key={payment.paymentId} className="payment-history-row">
              <span>{STAGE_LABEL[payment.payment_stage] ?? payment.payment_stage}</span>
              <span>{formatBaht(payment.amount)}</span>
              <span className={`payment-status payment-status--${payment.payment_status}`}>
                {STATUS_LABEL[payment.payment_status] ?? payment.payment_status}
              </span>
              <span className="payment-history-date">{formatDateTime(payment.paid_at)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
