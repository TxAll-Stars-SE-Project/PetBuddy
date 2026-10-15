// ข้อมูลตัวอย่าง (mock) สำหรับขั้น UX/UI ของ US6-1 เท่านั้น — ยังไม่ต่อ API จริง
// รอ POST /api/bookings จาก US5-1 เสร็จก่อน ถึงจะเปลี่ยนมาดึงข้อมูลจริงได้
// โครงสร้างอ้างอิงตาม docs/API.md § 2.3 Get my bookings (owner) และ § 3.1 Get payment summary

export const MOCK_OWNER_BOOKINGS = [
  {
    bookingId: 1,
    sitterName: "สมชาย ใจดี",
    serviceName: "รับเลี้ยงแมวข้ามคืน",
    starttime: "2026-10-20T09:00:00Z",
    endtime: "2026-10-20T18:00:00Z",
    bookingstatus: "waiting_payment",
    totalPrice: 6300,
    paymentplan: "deposit",
    pets: [{ petId: 1, petName: "เหมียว", petNote: "แมวขี้อาย" }],
  },
  {
    bookingId: 2,
    sitterName: "มาลี สวยงาม",
    serviceName: "พาสุนัขเดินเล่น",
    starttime: "2026-10-22T07:00:00Z",
    endtime: "2026-10-22T08:00:00Z",
    bookingstatus: "waiting_final_payment",
    totalPrice: 4200,
    paymentplan: "deposit",
    pets: [
      { petId: 2, petName: "บราวนี่", petNote: null },
      { petId: 3, petName: "จูเนียร์", petNote: "กลัวเสียงดัง" },
    ],
  },
  {
    bookingId: 3,
    sitterName: "สมชาย ใจดี",
    serviceName: "รับฝากดูแลรายวัน",
    starttime: "2026-09-28T09:00:00Z",
    endtime: "2026-09-29T09:00:00Z",
    bookingstatus: "confirmed",
    totalPrice: 2800,
    paymentplan: "full",
    pets: [{ petId: 1, petName: "เหมียว", petNote: null }],
  },
  {
    bookingId: 4,
    sitterName: "ธนากร รักสัตว์",
    serviceName: "อาบน้ำตัดขน",
    starttime: "2026-09-15T10:00:00Z",
    endtime: "2026-09-15T12:00:00Z",
    bookingstatus: "completed",
    totalPrice: 900,
    paymentplan: "full",
    pets: [{ petId: 4, petName: "โมจิ", petNote: null }],
  },
  {
    bookingId: 5,
    sitterName: "พิมพ์ชนก อบอุ่น",
    serviceName: "รับเลี้ยงที่บ้าน",
    starttime: "2026-09-10T09:00:00Z",
    endtime: "2026-09-10T17:00:00Z",
    bookingstatus: "cancelled",
    totalPrice: 1600,
    paymentplan: "full",
    pets: [{ petId: 2, petName: "บราวนี่", petNote: null }],
  },
  {
    bookingId: 6,
    sitterName: "ธนากร รักสัตว์",
    serviceName: "รับเลี้ยงรายวัน",
    starttime: "2026-10-25T09:00:00Z",
    endtime: "2026-10-26T09:00:00Z",
    bookingstatus: "pending",
    totalPrice: 2100,
    paymentplan: "deposit",
    pets: [{ petId: 3, petName: "จูเนียร์", petNote: null }],
  },
];

// อ้างอิงตาม § 3.1 Get payment summary — ใช้คำนวณยอดใน PaymentModal จาก booking ที่เลือก
export function buildMockPaymentSummary(booking) {
  const depositRate = 0.3;
  const isDeposit = booking.paymentplan === "deposit";
  const depositAmount = isDeposit ? Math.round(booking.totalPrice * depositRate) : booking.totalPrice;

  const payments = [];
  if (booking.bookingstatus === "waiting_final_payment") {
    payments.push({
      paymentId: 1,
      amount: depositAmount,
      payment_stage: "deposit",
      payment_status: "verified",
      paid_at: "2026-10-15T14:00:00Z",
    });
  }

  const paidSoFar = payments
    .filter((p) => p.payment_status === "verified")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    bookingId: booking.bookingId,
    bookingstatus: booking.bookingstatus,
    totalPrice: booking.totalPrice,
    paymentplan: booking.paymentplan,
    depositAmount,
    remainingAmount: booking.totalPrice - paidSoFar,
    payments,
  };
}
