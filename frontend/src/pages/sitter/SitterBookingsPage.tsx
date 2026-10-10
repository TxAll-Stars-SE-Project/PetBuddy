import SitterBookingCard from '../../components/sitter/SitterBookingCard';
import type { Booking, BookingAction } from '../../types/booking';

const MOCK_BOOKINGS: Booking[] = [
  {
    bookingId: 101,
    bookingstatus: 'pending',
    totalprice: 800,
    paymentplan: 'full',
    starttime: '2026-10-12T09:00:00+07:00',
    endtime: '2026-10-12T11:00:00+07:00',
    note: 'น้องชอบเดินเล่นในสวนใกล้บ้าน',
    owner: {
      ownerId: 201,
      fullname: 'ณัฐชา ใจดี',
      phone: '0812345678',
    },
    pets: [{ petId: 301, name: 'โมจิ', species: 'dog' }],
    service: {
      serviceId: 401,
      servicetype: 'walking',
      title: 'พาโมจิเดินเล่นตอนเช้า',
    },
  },
  {
    bookingId: 102,
    bookingstatus: 'confirmed',
    totalprice: 1200,
    paymentplan: 'deposit',
    starttime: '2026-10-13T13:00:00+07:00',
    endtime: '2026-10-13T17:00:00+07:00',
    note: 'ให้อาหารก่อนบ่ายสาม',
    owner: {
      ownerId: 202,
      fullname: 'กิตติพงษ์ สุขใจ',
      phone: '0898765432',
    },
    pets: [
      { petId: 302, name: 'ถุงทอง', species: 'cat' },
      { petId: 303, name: 'ถุงเงิน', species: 'cat' },
    ],
    service: {
      serviceId: 402,
      servicetype: 'sitting',
      title: 'ดูแลแมวระหว่างเจ้าของไม่อยู่',
    },
  },
  {
    bookingId: 103,
    bookingstatus: 'pending',
    totalprice: 1500,
    paymentplan: 'deposit',
    starttime: '2026-10-15T10:00:00+07:00',
    endtime: '2026-10-15T16:00:00+07:00',
    owner: {
      ownerId: 203,
      fullname: 'พิมพ์ชนก รักสัตว์',
      phone: '0861122334',
    },
    pets: [{ petId: 304, name: 'โกโก้', species: 'bird' }],
    service: {
      serviceId: 403,
      servicetype: 'daycare',
      title: 'รับดูแลโกโก้ช่วงกลางวัน',
    },
  },
];

export default function SitterBookingsPage() {
  const handleAction = (bookingId: number, action: BookingAction) =>
    alert(`Booking #${bookingId}: ${action}`);

  return (
    <main className="home-main">
      <section className="home-card">
        <h1>รายการคำขอการจอง (Sitter Bookings)</h1>
        <div className="sitter-bookings-list" style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          {MOCK_BOOKINGS.map((booking) => (
            <SitterBookingCard
              key={booking.bookingId}
              booking={booking}
              onAction={handleAction}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
