import { useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import PaymentModal from "../components/PaymentModal.jsx";
import { MOCK_OWNER_BOOKINGS, buildMockPaymentSummary } from "../data/mockBookings.js";

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
  const s = new Date(start);
  const e = new Date(end);
  const dateFmt = { day: "numeric", month: "short", year: "numeric" };
  const timeFmt = { hour: "2-digit", minute: "2-digit" };
  const sameDay = s.toDateString() === e.toDateString();
  if (sameDay) {
    return `${s.toLocaleDateString("th-TH", dateFmt)} · ${s.toLocaleTimeString("th-TH", timeFmt)} - ${e.toLocaleTimeString("th-TH", timeFmt)}`;
  }
  return `${s.toLocaleDateString("th-TH", dateFmt)} - ${e.toLocaleDateString("th-TH", dateFmt)}`;
}

// Design: OwnerBookingPage — รายการ booking ของเจ้าของสัตว์เลี้ยง + ปุ่มชำระเงิน (US6-1)
// ใช้ mock data ไปก่อน รอ POST /api/bookings (US5-1) แล้วค่อยเปลี่ยนมาเรียก GET /api/owner/bookings จริง
export default function OwnerBookingPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [payingBooking, setPayingBooking] = useState(null);

  const bookings = useMemo(() => {
    if (activeTab === "all") return MOCK_OWNER_BOOKINGS;
    return MOCK_OWNER_BOOKINGS.filter((b) => b.bookingstatus === activeTab);
  }, [activeTab]);

  const paymentSummary = payingBooking ? buildMockPaymentSummary(payingBooking) : null;

  return (
    <div>
      <Navbar />
      <main className="home-main booking-page">
        <h1 className="page-title">การจองของฉัน</h1>
        <p className="section-sub">ติดตามสถานะการจองและชำระเงินให้พี่เลี้ยงที่คุณเลือกไว้</p>

        <div className="booking-tabs">
          {FILTER_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`chip-btn${activeTab === t.key ? " active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {bookings.length === 0 ? (
          <div className="state-box">
            <div className="emoji">📅</div>
            <h3>ไม่มีรายการจองในหมวดนี้</h3>
            <p>ลองเลือกแท็บอื่น หรือเริ่มค้นหาพี่เลี้ยงเพื่อจองใหม่</p>
          </div>
        ) : (
          <div className="booking-list">
            {bookings.map((b) => {
              const meta = STATUS_META[b.bookingstatus] ?? { label: b.bookingstatus, tone: "muted" };
              const canPay = PAYABLE_STATUSES.includes(b.bookingstatus);
              return (
                <article key={b.bookingId} className="booking-card">
                  <div className="booking-card-top">
                    <div>
                      <h3 className="booking-sitter-name">{b.sitterName}</h3>
                      <p className="booking-service-name">{b.serviceName}</p>
                    </div>
                    <span className={`booking-badge booking-badge--${meta.tone}`}>{meta.label}</span>
                  </div>

                  <p className="booking-datetime">🗓️ {formatDateRange(b.starttime, b.endtime)}</p>

                  <div className="booking-pets">
                    {b.pets.map((p) => (
                      <span key={p.petId} className="tag">
                        🐾 {p.petName}
                        {p.petNote ? ` · ${p.petNote}` : ""}
                      </span>
                    ))}
                  </div>

                  <div className="booking-card-foot">
                    <div className="booking-price">
                      <small>ราคารวม</small>
                      <strong>฿{b.totalPrice.toLocaleString("th-TH")}</strong>
                    </div>
                    {canPay && (
                      <button type="button" className="btn btn--small" onClick={() => setPayingBooking(b)}>
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

      {payingBooking && (
        <PaymentModal
          booking={payingBooking}
          summary={paymentSummary}
          onClose={() => setPayingBooking(null)}
        />
      )}
    </div>
  );
}
