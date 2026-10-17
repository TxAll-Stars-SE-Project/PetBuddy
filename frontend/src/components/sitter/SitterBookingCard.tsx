import type { Booking, BookingAction, BookingStatus } from '../../types/booking';
import './SitterBookingCard.css';

interface SitterBookingCardProps {
  booking: Booking;
  onAction: (bookingId: number, action: BookingAction) => void;
  onRequestConfirm?: (booking: Booking, action: BookingAction) => void;
  onVerifySlip?: (booking: Booking) => void;
  isUpdating?: boolean;
  isVerifyingSlip?: boolean;
}

const statusLabels: Record<BookingStatus, string> = {
  pending: 'รอดำเนินการ',
  waiting_payment: 'รอชำระมัดจำ',
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

type ExtendedPet = { name?: string; petName?: string; type?: string; species?: string };
interface ExtendedBooking extends Booking {
  serviceName?: string;
  ownerName?: string;
}

export default function SitterBookingCard({
  booking,
  onAction,
  onRequestConfirm,
  onVerifySlip,
  isUpdating = false,
  isVerifyingSlip = false,
}: SitterBookingCardProps) {
  const b = booking as ExtendedBooking;
  const rawPets = Array.isArray(b.pets) ? (b.pets as ExtendedPet[]) : [];

  const petDetails = rawPets.length
    ? rawPets
        .map(
          (pet) =>
            `${pet.name || pet.petName || 'สัตว์เลี้ยง'}${
              pet.type || pet.species ? ` (${pet.type || pet.species})` : ''
            }`
        )
        .join(', ')
    : typeof b.petName === 'string'
      ? `${b.petName}${typeof b.petType === 'string' ? ` (${b.petType})` : ''}`
      : 'ไม่มีข้อมูลสัตว์เลี้ยง';

  const serviceTitle = b.service?.title || b.serviceName || 'บริการสัตว์เลี้ยง';
  const serviceTypeKey = b.service?.servicetype;
  const serviceTypeLabel = serviceTypeKey && serviceTypeLabels[serviceTypeKey]
    ? serviceTypeLabels[serviceTypeKey]
    : serviceTypeKey || 'บริการสัตว์เลี้ยง';

  const ownerName = b.owner?.fullname || b.ownerName || 'ไม่ระบุชื่อ';
  const ownerPhone = b.owner?.phone || '-';
  const statusKey = (b.bookingstatus || 'pending') as BookingStatus;
  const totalPriceNum = Number(b.totalprice) || 0;
  const paymentStatus = (b as ExtendedBooking & { payment_status?: string }).payment_status;
  const canReviewPayment = ['waiting_payment', 'waiting_final_payment'].includes(statusKey)
    || paymentStatus === 'pending_verifying';

  return (
    <article className="sitter-booking-card">
      <header className="sitter-booking-card__header">
        <div>
          <h2 className="sitter-booking-card__title">{serviceTitle}</h2>
          <p className="sitter-booking-card__service-type">{serviceTypeLabel}</p>
        </div>
        <span
          className={`sitter-booking-card__status sitter-booking-card__status--${statusKey}`}
        >
          {statusLabels[statusKey] || statusKey}
        </span>
      </header>

      <dl className="sitter-booking-card__details">
        <div className="sitter-booking-card__detail">
          <dt>เจ้าของ</dt>
          <dd>{ownerName}</dd>
        </div>
        <div className="sitter-booking-card__detail">
          <dt>เบอร์โทร</dt>
          <dd>
            {ownerPhone !== '-' ? (
              <a href={`tel:${ownerPhone}`}>{ownerPhone}</a>
            ) : (
              '-'
            )}
          </dd>
        </div>
        <div className="sitter-booking-card__detail sitter-booking-card__detail--wide">
          <dt>สัตว์เลี้ยง</dt>
          <dd>{petDetails}</dd>
        </div>
        <div className="sitter-booking-card__detail">
          <dt>เริ่ม</dt>
          <dd>{formatDateTime(b.starttime || '')}</dd>
        </div>
        <div className="sitter-booking-card__detail">
          <dt>สิ้นสุด</dt>
          <dd>{formatDateTime(b.endtime || '')}</dd>
        </div>
        <div className="sitter-booking-card__detail">
          <dt>ราคารวม</dt>
          <dd>{totalPriceNum.toLocaleString('th-TH')} บาท</dd>
        </div>
        <div className="sitter-booking-card__detail">
          <dt>แผนชำระเงิน</dt>
          <dd>{b.paymentplan === 'full' ? 'ชำระเต็มจำนวน' : 'ชำระมัดจำ'}</dd>
        </div>
        <div className="sitter-booking-card__detail sitter-booking-card__detail--wide">
          <dt>หมายเหตุ</dt>
          <dd>{b.note?.trim() || 'ไม่มีหมายเหตุ'}</dd>
        </div>
      </dl>

      {booking.bookingstatus === 'pending' && (
        <footer className="sitter-booking-card__actions">
          <button
            className="sitter-booking-card__button sitter-booking-card__button--reject"
            type="button"
            disabled={isUpdating}
            onClick={() =>
              onRequestConfirm
                ? onRequestConfirm(booking, 'reject')
                : onAction(booking.bookingId, 'reject')
            }
          >
            ปฏิเสธ (Reject)
          </button>
          <button
            className="sitter-booking-card__button sitter-booking-card__button--accept"
            type="button"
            disabled={isUpdating}
            onClick={() =>
              onRequestConfirm
                ? onRequestConfirm(booking, 'accept')
                : onAction(booking.bookingId, 'accept')
            }
          >
            รับงาน (Accept)
          </button>
        </footer>
      )}
      {booking.bookingstatus === 'confirmed' && (
        <footer className="sitter-booking-card__actions">
          <button
            className="sitter-booking-card__button sitter-booking-card__button--complete"
            type="button"
            disabled={isUpdating}
            onClick={() =>
              onRequestConfirm
                ? onRequestConfirm(booking, 'complete')
                : onAction(booking.bookingId, 'complete')
            }
          >
            ส่งงานเสร็จสิ้น (Complete Job)
          </button>
        </footer>
      )}
      {canReviewPayment && onVerifySlip && (
        <footer className="sitter-booking-card__actions">
          <button
            className="sitter-booking-card__button sitter-booking-card__button--verify-payment"
            type="button"
            disabled={isVerifyingSlip || isUpdating}
            onClick={() => onVerifySlip(booking)}
          >
            {isVerifyingSlip ? 'กำลังโหลดสลิป...' : 'ตรวจสอบสลิปการโอน'}
          </button>
        </footer>
      )}
    </article>
  );
}
