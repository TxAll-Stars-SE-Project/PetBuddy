import type { Booking, BookingAction, BookingStatus } from '../../types/booking';
import './SitterBookingCard.css';

interface SitterBookingCardProps {
  booking: Booking;
  onAction: (bookingId: number, action: BookingAction) => void;
  isUpdating?: boolean;
}

const statusLabels: Record<BookingStatus, string> = {
  pending: 'รอดำเนินการ',
  waiting_payment: 'รอชำระเงิน',
  deposit_paid: 'ชำระมัดจำแล้ว',
  confirmed: 'ยืนยันแล้ว',
  rejected: 'ปฏิเสธแล้ว',
  cancelled: 'ยกเลิกแล้ว',
  waiting_final_payment: 'รอชำระส่วนที่เหลือ',
  completed: 'เสร็จสิ้น',
};

const serviceTypeLabels: Record<Booking['service']['servicetype'], string> = {
  walking: 'พาสุนัขเดินเล่น',
  sitting: 'ดูแลสัตว์เลี้ยง',
  boarding: 'รับฝากสัตว์เลี้ยง',
  grooming: 'อาบน้ำตัดขน',
  daycare: 'รับดูแลช่วงกลางวัน',
};

const speciesLabels: Record<Booking['pets'][number]['species'], string> = {
  dog: 'สุนัข',
  cat: 'แมว',
  bird: 'นก',
  exotic: 'สัตว์พิเศษ',
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function SitterBookingCard({
  booking,
  onAction,
  isUpdating = false,
}: SitterBookingCardProps) {
  return (
    <article className="sitter-booking-card">
      <header className="sitter-booking-card__header">
        <div>
          <h2 className="sitter-booking-card__title">{booking.service.title}</h2>
          <p className="sitter-booking-card__service-type">
            {serviceTypeLabels[booking.service.servicetype]}
          </p>
        </div>
        <span
          className={`sitter-booking-card__status sitter-booking-card__status--${booking.bookingstatus}`}
        >
          {statusLabels[booking.bookingstatus]}
        </span>
      </header>

      <dl className="sitter-booking-card__details">
        <div className="sitter-booking-card__detail">
          <dt>เจ้าของ</dt>
          <dd>{booking.owner.fullname}</dd>
        </div>
        <div className="sitter-booking-card__detail">
          <dt>เบอร์โทร</dt>
          <dd>
            <a href={`tel:${booking.owner.phone}`}>{booking.owner.phone}</a>
          </dd>
        </div>
        <div className="sitter-booking-card__detail sitter-booking-card__detail--wide">
          <dt>สัตว์เลี้ยง</dt>
          <dd>
            {booking.pets.length > 0
              ? booking.pets
                  .map((pet) => `${pet.name} (${speciesLabels[pet.species]})`)
                  .join(', ')
              : 'ไม่มีข้อมูลสัตว์เลี้ยง'}
          </dd>
        </div>
        <div className="sitter-booking-card__detail">
          <dt>เริ่ม</dt>
          <dd>{formatDateTime(booking.starttime)}</dd>
        </div>
        <div className="sitter-booking-card__detail">
          <dt>สิ้นสุด</dt>
          <dd>{formatDateTime(booking.endtime)}</dd>
        </div>
        <div className="sitter-booking-card__detail">
          <dt>ราคารวม</dt>
          <dd>{booking.totalprice.toLocaleString('th-TH')} บาท</dd>
        </div>
        <div className="sitter-booking-card__detail">
          <dt>แผนชำระเงิน</dt>
          <dd>{booking.paymentplan === 'full' ? 'ชำระเต็มจำนวน' : 'ชำระมัดจำ'}</dd>
        </div>
        <div className="sitter-booking-card__detail sitter-booking-card__detail--wide">
          <dt>หมายเหตุ</dt>
          <dd>{booking.note?.trim() || 'ไม่มีหมายเหตุ'}</dd>
        </div>
      </dl>

      {booking.bookingstatus === 'pending' && (
        <footer className="sitter-booking-card__actions">
          <button
            className="sitter-booking-card__button sitter-booking-card__button--reject"
            type="button"
            disabled={isUpdating}
            onClick={() => onAction(booking.bookingId, 'reject')}
          >
            ปฏิเสธ (Reject)
          </button>
          <button
            className="sitter-booking-card__button sitter-booking-card__button--accept"
            type="button"
            disabled={isUpdating}
            onClick={() => onAction(booking.bookingId, 'accept')}
          >
            รับงาน (Accept)
          </button>
        </footer>
      )}
      {booking.bookingstatus === 'confirmed' && (
        <footer className="sitter-booking-card__actions">
          <button
            className="sitter-booking-card__button sitter-booking-card__button--accept"
            type="button"
            disabled={isUpdating}
            onClick={() => onAction(booking.bookingId, 'complete')}
          >
            ส่งงานเสร็จสิ้น (Complete Job)
          </button>
        </footer>
      )}
    </article>
  );
}
