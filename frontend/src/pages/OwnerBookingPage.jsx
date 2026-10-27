import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import PaymentModal from "../components/payment/PaymentModal.jsx";
import { getBookingPayments } from "../services/payment.api.js";
import { getOwnerBookings } from "../services/bookings.js";

const STATUS_META = {
  pending: { label: "รอพี่เลี้ยงตอบรับ", tone: "muted" },
  waiting_payment: { label: "รอชำระมัดจำ", tone: "warning" },
  deposit_paid: { label: "ชำระมัดจำแล้ว", tone: "success" },
  confirmed: { label: "ยืนยันแล้ว", tone: "success" },
  waiting_final_payment: { label: "รอชำระส่วนที่เหลือ", tone: "warning" },
  completed: { label: "เสร็จสิ้น", tone: "muted" },
  rejected: { label: "ถูกปฏิเสธ", tone: "error" },
  cancelled: { label: "ยกเลิกแล้ว", tone: "error" },
};

const FILTER_TABS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "waiting_payment", label: "รอชำระเงิน" },
  { key: "confirmed", label: "ยืนยันแล้ว" },
  { key: "completed", label: "เสร็จสิ้น" },
];

const PAYABLE_STATUSES = ["waiting_payment", "waiting_final_payment"];

function formatDateRange(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateFormat = { day: "numeric", month: "short", year: "numeric" };
  const timeFormat = { hour: "2-digit", minute: "2-digit" };
  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) {
    return `${startDate.toLocaleDateString("th-TH", dateFormat)} · ${startDate.toLocaleTimeString("th-TH", timeFormat)} - ${endDate.toLocaleTimeString("th-TH", timeFormat)}`;
  }
  return `${startDate.toLocaleDateString("th-TH", dateFormat)} - ${endDate.toLocaleDateString("th-TH", dateFormat)}`;
}

export default function OwnerBookingPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ status: "loading", bookings: [] });
  const [payingBooking, setPayingBooking] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [isPaymentSummaryLoading, setIsPaymentSummaryLoading] = useState(false);
  const [paymentSummaryError, setPaymentSummaryError] = useState(false);
  const [paymentSummaryReloadKey, setPaymentSummaryReloadKey] = useState(0);

  const payingBookingId = payingBooking?.bookingId || payingBooking?.id;

  useEffect(() => {
    if (!payingBooking) {
      setPaymentSummary(null);
      setIsPaymentSummaryLoading(false);
      setPaymentSummaryError(false);
      return undefined;
    }

    let isCurrent = true;
    setPaymentSummary(null);
    setIsPaymentSummaryLoading(true);
    setPaymentSummaryError(false);

    getBookingPayments(payingBookingId)
      .then((response) => {
        const summary = response?.data?.data ?? response?.data;
        if (!summary || typeof summary !== "object" || !Array.isArray(summary.payments)) {
          throw new Error("รูปแบบข้อมูลสรุปการชำระเงินไม่ถูกต้อง");
        }
        if (isCurrent) setPaymentSummary(summary);
      })
      .catch(() => {
        if (isCurrent) setPaymentSummaryError(true);
      })
      .finally(() => {
        if (isCurrent) setIsPaymentSummaryLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [payingBooking, payingBookingId, paymentSummaryReloadKey]);

  const handlePaymentClose = () => {
    setPayingBooking(null);
  };

  const handlePaymentSuccess = () => {
    setPayingBooking(null);
  };

  useEffect(() => {
    const controller = new AbortController();
    setResult((current) => ({ ...current, status: "loading" }));
    getOwnerBookings(activeTab === "all" ? "" : activeTab, { signal: controller.signal })
      .then((bookings) => setResult({ status: "success", bookings }))
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult((current) => ({ ...current, status: "error" }));
      });
    return () => controller.abort();
  }, [activeTab, reloadKey]);

  const { status, bookings } = result;

  return (
    <div>
      <Navbar />
      <main className="home-main booking-page">
        <h1 className="page-title">การจองของฉัน</h1>
        <p className="section-sub">ติดตามสถานะการจองและชำระเงินให้พี่เลี้ยงที่คุณเลือกไว้</p>

        <div className="booking-tabs">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`chip-btn${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {status === "loading" && bookings.length === 0 && (
          <div className="state-box" role="status">
            <h3>กำลังโหลดรายการจอง…</h3>
          </div>
        )}

        {status === "error" && (
          <div className="state-box state-box--error" role="alert">
            <h3>โหลดรายการจองไม่สำเร็จ</h3>
            <p>เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง</p>
            <button type="button" className="btn" onClick={() => setReloadKey((key) => key + 1)}>
              ลองใหม่
            </button>
          </div>
        )}

        {status === "success" && bookings.length === 0 && (
          <div className="state-box">
            <h3>ไม่มีรายการจองในหมวดนี้</h3>
            <p>ลองเลือกแท็บอื่น หรือเริ่มค้นหาพี่เลี้ยงเพื่อจองใหม่</p>
          </div>
        )}

        {bookings.length > 0 && status !== "error" && (
          <div className={`booking-list${status === "loading" ? " is-loading" : ""}`}>
            {bookings.map((booking) => {
              const meta = STATUS_META[booking.bookingstatus]
                ?? { label: booking.bookingstatus, tone: "muted" };
              const canPay = PAYABLE_STATUSES.includes(booking.bookingstatus);
              return (
                <article key={booking.bookingId} className="booking-card">
                  <div className="booking-card-top">
                    <div>
                      <h3 className="booking-sitter-name">{booking.sitterName}</h3>
                      <p className="booking-service-name">{booking.serviceName}</p>
                    </div>
                    <span className={`booking-badge booking-badge--${meta.tone}`}>
                      {meta.label}
                    </span>
                  </div>

                  <p className="booking-datetime">
                    วันที่: {formatDateRange(booking.starttime, booking.endtime)}
                  </p>

                  <div className="booking-pets">
                    {booking.pets.map((pet) => (
                      <span key={pet.petId} className="tag">
                        {pet.petName}
                        {pet.petNote ? ` · ${pet.petNote}` : ""}
                      </span>
                    ))}
                  </div>

                  <div className="booking-card-foot">
                    <div className="booking-price">
                      <small>ราคารวม</small>
                      <strong>฿{Number(booking.totalPrice).toLocaleString("th-TH")}</strong>
                    </div>
                    {canPay && (
                      <button
                        type="button"
                        className="btn btn--small"
                        onClick={() => {
                          setPaymentSummary(null);
                          setPayingBooking(booking);
                        }}
                      >
                        ชำระเงิน
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <PaymentModal
        isOpen={Boolean(payingBooking)}
        booking={payingBooking}
        summary={paymentSummary}
        isLoading={isPaymentSummaryLoading}
        isError={paymentSummaryError}
        onRetry={() => setPaymentSummaryReloadKey((key) => key + 1)}
        onClose={handlePaymentClose}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
