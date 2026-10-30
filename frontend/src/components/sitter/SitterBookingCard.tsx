import type { Booking, BookingAction, BookingStatus } from '../../types/booking';
import './SitterBookingCard.css';

interface SitterBookingCardProps {
  booking: Booking;
  onAction?: (bookingId: number, action: BookingAction) => void;
  onRequestConfirm?: (booking: Booking, action: BookingAction) => void;
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

const statusSymbols: Record<BookingStatus, string> = {
  pending: '●',
  waiting_payment: '●',
  deposit_paid: '●',
  confirmed: '●',
  rejected: '×',
  cancelled: '−',
  waiting_final_payment: '●',
  completed: '✓',
};

const serviceTypeLabels: Record<Booking['service']['servicetype'], string> = {
  walking: 'พาสุนัขเดินเล่น',
  sitting: 'ดูแลสัตว์เลี้ยง',
  boarding: 'รับฝากสัตว์เลี้ยง',
  grooming: 'อาบน้ำตัดขน',
  daycare: 'รับดูแลช่วงกลางวัน',
};

const speciesLabels: Record<string, string> = {
  dog: 'สุนัข',
  cat: 'แมว',
  bird: 'นก',
  exotic: 'สัตว์พิเศษ',
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || '-';
  }

  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getPetDetails(booking: Booking): string {
  if (booking.pets?.length) {
    return booking.pets
      .map((pet) => {
        const name = pet.petName || pet.name || 'สัตว์เลี้ยง';
        const species = pet.species || pet.type;
        const details = [
          species ? speciesLabels[species] || species : '',
          pet.breed || '',
        ].filter(Boolean);
        return details.length ? `${name} (${details.join(', ')})` : name;
      })
      .join(', ');
  }

  if (booking.petName) {
    return `${booking.petName}${booking.petType ? ` (${booking.petType})` : ''}`;
  }
  return 'ไม่มีข้อมูลสัตว์เลี้ยง';
}

export default function SitterBookingCard({
  booking,
  onAction,
  onRequestConfirm,
  isUpdating = false,
}: SitterBookingCardProps) {
  const serviceTypeLabel =
    serviceTypeLabels[booking.service.servicetype] || booking.service.servicetype;
  const totalPrice = Number(booking.totalprice) || 0;
  const runAction = (action: BookingAction) => {
    if (onRequestConfirm) {
      onRequestConfirm(booking, action);
    } else {
      onAction?.(booking.bookingId, action);
    }
  };

  return (
    <article className="sitter-booking-card">
      <header className="sitter-booking-card__header">
        <div>
          <h2 className="sitter-booking-card__title">
            {booking.service.title || booking.serviceName || 'บริการสัตว์เลี้ยง'}
          </h2>
          <p className="sitter-booking-card__service-type">
            {serviceTypeLabel || 'บริการสัตว์เลี้ยง'}
          </p>
        </div>
        <span
          className={`sitter-booking-card__status sitter-booking-card__status--${booking.bookingstatus}`}
        >
          <span className="sitter-booking-card__status-symbol" aria-hidden="true">
            {statusSymbols[booking.bookingstatus]}
          </span>
          {statusLabels[booking.bookingstatus]}
        </span>
      </header>

      <dl className="sitter-booking-card__details">
        <div className="sitter-booking-card__detail">
          <dt>เจ้าของ</dt>
          <dd>{booking.owner.fullname || booking.ownerName || 'ไม่ระบุชื่อ'}</dd>
        </div>
        <div className="sitter-booking-card__detail">
          <dt>เบอร์โทร</dt>
          <dd>
            {booking.owner.phone ? (
              <a href={`tel:${booking.owner.phone}`}>{booking.owner.phone}</a>
            ) : (
              '-'
            )}
          </dd>
        </div>
        <div className="sitter-booking-card__detail sitter-booking-card__detail--wide">
          <dt>สัตว์เลี้ยง</dt>
          <dd>{getPetDetails(booking)}</dd>
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
          <dd>{totalPrice.toLocaleString('th-TH')} บาท</dd>
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

      {booking.bookingstatus === 'pending' && (onAction || onRequestConfirm) && (
        <footer className="sitter-booking-card__actions">
          <button
            className="sitter-booking-card__button sitter-booking-card__button--reject"
            type="button"
            disabled={isUpdating}
            onClick={() => runAction('reject')}
          >
            ปฏิเสธ (Reject)
          </button>
          <button
            className="sitter-booking-card__button sitter-booking-card__button--accept"
            type="button"
            disabled={isUpdating}
            onClick={() => runAction('accept')}
          >
            รับงาน (Accept)
          </button>
        </footer>
      )}
      {booking.bookingstatus === 'confirmed' && (onAction || onRequestConfirm) && (
        <footer className="sitter-booking-card__actions">
          <button
            className="sitter-booking-card__button sitter-booking-card__button--complete"
            type="button"
            disabled={isUpdating}
            onClick={() => runAction('complete')}
          >
            ส่งงานเสร็จสิ้น (Complete Job)
          </button>
        </footer>
      )}
    </article>
  );
}
