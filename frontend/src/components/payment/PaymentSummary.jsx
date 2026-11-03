import { useState } from "react";

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
  const [isQrLightboxOpen, setIsQrLightboxOpen] = useState(false);

  if (!summary) return null;

  const isDeposit = summary.paymentplan === "deposit";
  const hasPendingPayment = summary.payments?.some(
    (payment) => payment.payment_status === "pending_verifying",
  );
  const paymentStage = summary.bookingstatus === "waiting_final_payment"
    ? "final"
    : summary.payment_stage
      || (summary.paymentplan === "deposit" ? "deposit" : "full");
  const isFinalPayment = paymentStage === "final"
    || summary.bookingstatus === "waiting_final_payment";
  const amountDueNow = isFinalPayment
    ? summary.remainingAmount
    : paymentStage === "deposit"
      ? summary.depositAmount
      : summary.totalPrice;

  const sitterPaymentInfo = summary.sitterPaymentInfo;
  const hasSitterPaymentInfo = Boolean(
    sitterPaymentInfo?.accountName && sitterPaymentInfo?.qrCodeUrl,
  );

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
        {isFinalPayment ? (
          <>
            <div className="payment-row">
              <span>ราคาทั้งหมด</span>
              <span>{formatBaht(summary.totalPrice)}</span>
            </div>
            <div className="payment-row">
              <span>ชำระมัดจำแล้ว</span>
              <span className="payment-row--deposit-paid">- {formatBaht(summary.depositAmount)}</span>
            </div>
            <div className="payment-row payment-row--total">
              <span>ยอดคงเหลือที่ต้องชำระ</span>
              <span>{formatBaht(summary.remainingAmount)}</span>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* โซนแสดง QR Code และชื่อบัญชีรับเงินของพี่เลี้ยง (Sprint 3 US 6-2) */}
      {hasSitterPaymentInfo ? (
        <div className="payment-qr-card" aria-label="ข้อมูลบัญชีรับเงินของพี่เลี้ยง">
          <div className="payment-qr-header">
            <span className="payment-qr-title">สแกน QR Code เพื่อโอนเงินให้พี่เลี้ยง</span>
            <span className="payment-qr-badge">พร้อมเพย์ / ธนาคาร</span>
          </div>
          <div className="payment-qr-body">
            <button
              type="button"
              className="payment-qr-image-btn"
              onClick={() => setIsQrLightboxOpen(true)}
              aria-label="คลิกเพื่อขยายรูป QR Code"
            >
              <img
                src={sitterPaymentInfo.qrCodeUrl}
                alt={`QR Code รับเงินของ ${sitterPaymentInfo.accountName}`}
                className="payment-qr-image"
              />
              <span className="payment-qr-zoom-hint">คลิกที่รูปเพื่อขยาย</span>
            </button>
            <div className="payment-qr-details">
              <div className="payment-qr-account-label">ชื่อบัญชีผู้รับเงิน (พี่เลี้ยง)</div>
              <div className="payment-qr-account-name">{sitterPaymentInfo.accountName}</div>
              <div className="payment-qr-amount-chip">
                ยอดโอน {formatBaht(amountDueNow)}
              </div>
              <p className="payment-qr-verify-note">
                ระบบจะตรวจสอบยอดเงิน เวลาโอน และชื่อผู้รับในสลิปให้ตรงกับชื่อบัญชีพี่เลี้ยงโดยอัตโนมัติ
              </p>
            </div>
          </div>
        </div>
      ) : (
        !isError && (
          <div className="payment-missing-qr-banner" role="alert">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>พี่เลี้ยงยังไม่ได้ตั้งค่าบัญชีรับเงินหรือ QR Code</strong>
              <p>กรุณาติดต่อพี่เลี้ยงให้เพิ่มชื่อบัญชีและรูป QR Code ก่อนดำเนินการชำระเงิน</p>
            </div>
          </div>
        )
      )}

      {/* Lightbox สำหรับขยายดูรูป QR Code ขนาดใหญ่ */}
      {isQrLightboxOpen && hasSitterPaymentInfo && (
        <div
          className="payment-qr-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="รูป QR Code ขนาดขยาย"
          onClick={() => setIsQrLightboxOpen(false)}
        >
          <div
            className="payment-qr-lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={sitterPaymentInfo.qrCodeUrl}
              alt={`QR Code รับเงินของ ${sitterPaymentInfo.accountName}`}
            />
            <div className="payment-qr-lightbox-meta">
              <strong>{sitterPaymentInfo.accountName}</strong>
              <span>ยอดโอน {formatBaht(amountDueNow)}</span>
            </div>
            <button
              type="button"
              className="delete-cancel-button"
              onClick={() => setIsQrLightboxOpen(false)}
            >
              ปิดหน้าต่างขยาย
            </button>
          </div>
        </div>
      )}

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
