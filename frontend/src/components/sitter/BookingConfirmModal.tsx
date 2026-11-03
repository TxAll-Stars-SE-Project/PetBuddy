import { useEffect } from 'react';
import { isStartDateReached, type Booking, type BookingAction } from '../../types/booking';
import './BookingConfirmModal.css';

interface BookingConfirmModalProps {
  isOpen: boolean;
  booking: Booking | null;
  action: BookingAction | null;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ActionMeta {
  title: string;
  description: string;
  confirmLabel: string;
  buttonClass: string;
  warningNote?: string;
}

function formatThaiDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || '-';
  }

  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getActionMeta(action: BookingAction, booking: Booking): ActionMeta {
  if (action === 'accept') {
    return {
      title: 'ยืนยันการรับงานคำขอจอง',
      description:
        'คุณต้องการรับงานคำขอนี้ใช่หรือไม่? เมื่อกดยืนยัน ระบบจะเปลี่ยนสถานะเป็น "รอชำระเงิน" และส่งอีเมลแจ้งเตือนไปยังเจ้าของสัตว์เลี้ยงเพื่อให้ดำเนินการชำระเงิน',
      confirmLabel: 'ยืนยันรับงาน (Accept)',
      buttonClass: 'booking-confirm-modal__button--accept',
    };
  }

  if (action === 'reject') {
    return {
      title: 'ยืนยันการปฏิเสธคำขอจอง',
      description:
        'คุณต้องการปฏิเสธคำขอนี้ใช่หรือไม่? ระบบจะเปลี่ยนสถานะเป็น "ปฏิเสธแล้ว" และแจ้งเตือนเจ้าของสัตว์เลี้ยง',
      confirmLabel: 'ยืนยันปฏิเสธ (Reject)',
      buttonClass: 'booking-confirm-modal__button--reject',
      warningNote: 'ข้อควรระวัง: การปฏิเสธคำขอเป็นการดำเนินการที่ไม่สามารถย้อนกลับได้',
    };
  }

  if (action === 'start') {
    const reachedDDay = isStartDateReached(booking.starttime);
    return {
      title: 'ยืนยันการเริ่มงานดูแลสัตว์เลี้ยง',
      description:
        'คุณพร้อมเริ่มดูแลสัตว์เลี้ยงตามรายการจองนี้แล้วใช่หรือไม่? เมื่อกดยืนยัน ระบบจะเปลี่ยนสถานะเป็น "กำลังดูแล" และส่งอีเมลแจ้งเตือนให้เจ้าของสัตว์เลี้ยงทราบทันที',
      confirmLabel: 'ยืนยันเริ่มงาน (Start Service)',
      buttonClass: 'booking-confirm-modal__button--start',
      warningNote: reachedDDay
        ? undefined
        : `ยังไม่ถึงวันนัดหมายเริ่มบริการ (กำหนดเริ่ม: ${formatThaiDate(booking.starttime)}) พี่เลี้ยงสามารถกดเริ่มงานได้เมื่อถึงวันนัดหมายเท่านั้น`,
    };
  }

  const isFullPlan = booking.paymentplan === 'full';
  return {
    title: 'ยืนยันการส่งมอบงานเสร็จสิ้น',
    description: isFullPlan
      ? 'คุณได้ดูแลสัตว์เลี้ยงเสร็จสิ้นตามข้อตกลงแล้วใช่หรือไม่? เนื่องจากรายการนี้ชำระเต็มจำนวน 100% แล้ว ระบบจะเปลี่ยนสถานะเป็น "เสร็จสิ้น" และส่งอีเมลแจ้งเจ้าของสัตว์เลี้ยงเพื่อเปิดให้รีวิวทันที'
      : 'คุณได้ดูแลสัตว์เลี้ยงเสร็จสิ้นตามข้อตกลงแล้วใช่หรือไม่? เนื่องจากรายการนี้เป็นแผนชำระมัดจำ 30% ระบบจะเปลี่ยนสถานะเป็น "รอชำระส่วนที่เหลือ" และส่งอีเมลแจ้งเจ้าของสัตว์เลี้ยงให้ชำระยอดคงเหลืออีก 70%',
    confirmLabel: 'ยืนยันส่งงาน (Complete Service)',
    buttonClass: 'booking-confirm-modal__button--complete',
  };
}

export default function BookingConfirmModal({
  isOpen,
  booking,
  action,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: BookingConfirmModalProps) {
  // รองรับการกดแป้น ESC เพื่อปิดหน้าต่าง Modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen || !booking || !action) {
    return null;
  }

  const meta = getActionMeta(action, booking);
  const serviceName = booking.service?.title || 'บริการสัตว์เลี้ยง';
  const ownerName = booking.owner?.fullname || 'เจ้าของสัตว์เลี้ยง';
  const totalPrice = Number(booking.totalprice) || 0;
  const isBlockedByDDay = action === 'start' && !isStartDateReached(booking.starttime);
  const isBlockedByStatus =
    (action === 'start' &&
      booking.bookingstatus !== 'confirmed' &&
      booking.bookingstatus !== 'deposit_paid') ||
    (action === 'complete' && booking.bookingstatus !== 'in_progress');
  const isConfirmDisabled = isSubmitting || isBlockedByDDay || isBlockedByStatus;

  return (
    <div
      className="booking-confirm-modal__overlay"
      onClick={isSubmitting ? undefined : onCancel}
      role="presentation"
    >
      <div
        className="booking-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="booking-confirm-modal__header">
          <h2 id="confirm-modal-title" className="booking-confirm-modal__title">
            {meta.title}
          </h2>
          <button
            type="button"
            className="booking-confirm-modal__close"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="ปิดหน้าต่าง"
          >
            ×
          </button>
        </header>

        <div className="booking-confirm-modal__body">
          <p className="booking-confirm-modal__description">{meta.description}</p>

          <div className="booking-confirm-modal__summary-card">
            <div className="booking-confirm-modal__summary-row">
              <span className="booking-confirm-modal__summary-label">เจ้าของสัตว์เลี้ยง:</span>
              <span className="booking-confirm-modal__summary-value">{ownerName}</span>
            </div>
            <div className="booking-confirm-modal__summary-row">
              <span className="booking-confirm-modal__summary-label">บริการ:</span>
              <span className="booking-confirm-modal__summary-value">{serviceName}</span>
            </div>
            <div className="booking-confirm-modal__summary-row">
              <span className="booking-confirm-modal__summary-label">วัน-เวลาเริ่ม:</span>
              <span className="booking-confirm-modal__summary-value">
                {formatThaiDate(booking.starttime)}
              </span>
            </div>
            <div className="booking-confirm-modal__summary-row">
              <span className="booking-confirm-modal__summary-label">แผนชำระเงิน:</span>
              <span className="booking-confirm-modal__summary-value">
                {booking.paymentplan === 'full' ? 'ชำระเต็มจำนวน (100%)' : 'ชำระมัดจำ (30%)'}
              </span>
            </div>
            <div className="booking-confirm-modal__summary-row">
              <span className="booking-confirm-modal__summary-label">ยอดรวม:</span>
              <span className="booking-confirm-modal__summary-value booking-confirm-modal__summary-price">
                {totalPrice.toLocaleString('th-TH')} บาท
              </span>
            </div>
          </div>

          {meta.warningNote && (
            <div className="booking-confirm-modal__warning" role="alert">
              <span>{meta.warningNote}</span>
            </div>
          )}
        </div>

        <footer className="booking-confirm-modal__footer">
          <button
            type="button"
            className="booking-confirm-modal__button booking-confirm-modal__button--cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            className={`booking-confirm-modal__button ${meta.buttonClass}`}
            onClick={onConfirm}
            disabled={isConfirmDisabled}
          >
            {isSubmitting ? 'กำลังดำเนินการ...' : meta.confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
