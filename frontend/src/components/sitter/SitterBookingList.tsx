import { useCallback, useEffect, useMemo, useState } from 'react';
import BookingConfirmModal from './BookingConfirmModal';
import SitterBookingCard from './SitterBookingCard';
import { getSitterBookings, updateBookingStatus } from '../../services/booking.api';
import { toast } from '../../utils/toast';
import {
  isStartDateReached,
  type Booking,
  type BookingAction,
  type BookingStatus,
} from '../../types/booking';
import './SitterBookingList.css';

type BookingTab = 'ALL' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const statusGroups: Record<Exclude<BookingTab, 'ALL'>, BookingStatus[]> = {
  pending: ['pending'],
  confirmed: ['waiting_payment', 'deposit_paid', 'confirmed', 'in_progress', 'waiting_final_payment'],
  completed: ['completed'],
  cancelled: ['rejected', 'cancelled'],
};

const tabs: { id: BookingTab; label: string }[] = [
  { id: 'ALL', label: 'ทั้งหมด' },
  { id: 'pending', label: 'รอดำเนินการ' },
  { id: 'confirmed', label: 'ยืนยันแล้ว' },
  { id: 'completed', label: 'สำเร็จ' },
  { id: 'cancelled', label: 'ยกเลิก/ปฏิเสธ' },
];

export default function SitterBookingList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<BookingTab>('ALL');
  const [confirmTarget, setConfirmTarget] = useState<{
    booking: Booking;
    action: BookingAction;
  } | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setBookings(await getSitterBookings());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลการจองได้');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (first, second) =>
          Number(second.bookingstatus === 'pending') -
          Number(first.bookingstatus === 'pending'),
      ),
    [bookings],
  );

  const filteredBookings =
    activeTab === 'ALL'
      ? sortedBookings
      : sortedBookings.filter((booking) =>
          statusGroups[activeTab].includes(booking.bookingstatus),
        );

  const countForTab = (tab: BookingTab) =>
    tab === 'ALL'
      ? bookings.length
      : bookings.filter((booking) =>
          statusGroups[tab].includes(booking.bookingstatus),
        ).length;

  const handleRequestConfirm = (booking: Booking, action: BookingAction) => {
    if (
      action === 'start' &&
      booking.bookingstatus !== 'confirmed' &&
      booking.bookingstatus !== 'deposit_paid'
    ) {
      toast('สามารถกดเริ่มงานได้เฉพาะรายการที่ชำระมัดจำหรือยืนยันการจองแล้วเท่านั้น', 'error');
      return;
    }

    if (action === 'complete' && booking.bookingstatus !== 'in_progress') {
      toast('ไม่สามารถส่งมอบงานได้ กรุณากดเริ่มงานดูแล (Start Service) ก่อนส่งมอบงาน', 'error');
      return;
    }

    setConfirmTarget({ booking, action });
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget) return;

    const { booking, action } = confirmTarget;

    if (
      action === 'start' &&
      booking.bookingstatus !== 'confirmed' &&
      booking.bookingstatus !== 'deposit_paid'
    ) {
      toast('สามารถกดเริ่มงานได้เฉพาะรายการที่ชำระมัดจำหรือยืนยันการจองแล้วเท่านั้น', 'error');
      setConfirmTarget(null);
      return;
    }

    if (action === 'start' && !isStartDateReached(booking.starttime)) {
      toast('ยังไม่ถึงวันนัดหมายเริ่มบริการ ไม่สามารถเริ่มงานก่อนกำหนดได้', 'error');
      return;
    }

    if (action === 'complete' && booking.bookingstatus !== 'in_progress') {
      toast('ไม่สามารถส่งมอบงานได้ กรุณากดเริ่มงานดูแล (Start Service) ก่อนส่งมอบงาน', 'error');
      setConfirmTarget(null);
      return;
    }

    setUpdatingId(booking.bookingId);
    setError(null);

    try {
      await updateBookingStatus(booking.bookingId, action);
      const actionText =
        action === 'accept'
          ? 'รับงานคำขอจองเรียบร้อยแล้ว (สถานะ: รอชำระเงิน)'
          : action === 'reject'
            ? 'ปฏิเสธคำขอจองเรียบร้อยแล้ว'
            : action === 'start'
              ? 'เริ่มงานดูแลสัตว์เลี้ยงเรียบร้อยแล้ว (สถานะ: กำลังดูแล)'
              : booking.paymentplan === 'full'
                ? 'ส่งมอบงานเสร็จสิ้นสมบูรณ์เรียบร้อยแล้ว (สถานะ: เสร็จสิ้น)'
                : 'ส่งมอบงานเรียบร้อยแล้ว (สถานะ: รอชำระส่วนที่เหลือ 70%)';
      toast(actionText, 'success');
      setConfirmTarget(null);
      await fetchBookings();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'ไม่สามารถอัปเดตสถานะการจองได้';
      setError(errMsg);
      toast(errMsg, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="sitter-booking-list">
      <nav className="sitter-booking-list__tabs" aria-label="กรองรายการจองตามสถานะ">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`sitter-booking-list__tab${activeTab === tab.id ? ' is-active' : ''}`}
            type="button"
            aria-pressed={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            <span className="sitter-booking-list__count">{countForTab(tab.id)}</span>
          </button>
        ))}
      </nav>

      {loading ? (
        <p role="status">กำลังโหลดข้อมูล...</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => void fetchBookings()}>
            ลองใหม่
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <p>ยังไม่มีรายการคำขอการจอง</p>
      ) : filteredBookings.length === 0 ? (
        <p>ไม่มีรายการในสถานะนี้</p>
      ) : (
        <div className="sitter-booking-list__items">
          {filteredBookings.map((booking) => (
            <SitterBookingCard
              key={booking.bookingId}
              booking={booking}
              onRequestConfirm={handleRequestConfirm}
              isUpdating={updatingId === booking.bookingId}
            />
          ))}
        </div>
      )}

      <BookingConfirmModal
        isOpen={confirmTarget !== null}
        booking={confirmTarget?.booking ?? null}
        action={confirmTarget?.action ?? null}
        isSubmitting={updatingId !== null}
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
