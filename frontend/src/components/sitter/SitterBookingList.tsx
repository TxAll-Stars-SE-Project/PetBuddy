import { useCallback, useEffect, useMemo, useState } from 'react';
import SitterBookingCard from './SitterBookingCard';
import BookingConfirmModal from './BookingConfirmModal';
import { getSitterBookings, updateBookingStatus } from '../../services/booking.api';
import { toast } from '../../utils/toast';
import type { Booking, BookingAction, BookingStatus } from '../../types/booking';
import './SitterBookingList.css';

type BookingTab = 'ALL' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const statusGroups: Record<Exclude<BookingTab, 'ALL'>, BookingStatus[]> = {
  pending: ['pending'],
  confirmed: ['waiting_payment', 'waiting_final_payment'],
  completed: ['confirmed', 'completed', 'deposit_paid'],
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
      const result = await getSitterBookings();
      let list: Booking[] = [];

      if (Array.isArray(result)) {
        list = result;
      } else if (result && typeof result === 'object') {
        const raw = result as Record<string, unknown>;
        if (Array.isArray(raw.data)) {
          list = raw.data as Booking[];
        } else if (raw.data && typeof raw.data === 'object') {
          const inner = raw.data as Record<string, unknown>;
          if (Array.isArray(inner.data)) {
            list = inner.data as Booking[];
          } else if (Array.isArray(inner)) {
            list = inner as Booking[];
          }
        }
      }

      setBookings(list);
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

  const safeBookings = useMemo(() => (Array.isArray(bookings) ? bookings : []), [bookings]);

  const sortedBookings = useMemo(
    () =>
      [...safeBookings].sort(
        (first, second) =>
          Number(second?.bookingstatus === 'pending') -
          Number(first?.bookingstatus === 'pending'),
      ),
    [safeBookings],
  );

  const filteredBookings =
    activeTab === 'ALL'
      ? sortedBookings
      : sortedBookings.filter((booking) =>
          booking && statusGroups[activeTab]?.includes(booking.bookingstatus),
        );

  const countForTab = (tab: BookingTab) =>
    tab === 'ALL'
      ? safeBookings.length
      : safeBookings.filter((booking) =>
          booking && statusGroups[tab]?.includes(booking.bookingstatus),
        ).length;

  const handleRequestConfirm = (booking: Booking, action: BookingAction) => {
    setConfirmTarget({ booking, action });
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget) return;

    const { booking, action } = confirmTarget;
    setUpdatingId(booking.bookingId);
    setError(null);

    try {
      await updateBookingStatus(booking.bookingId, action);
      const actionText =
        action === 'accept'
          ? 'รับงานคำขอจองเรียบร้อยแล้ว (สถานะ: รอชำระเงิน)'
          : action === 'reject'
            ? 'ปฏิเสธคำขอจองเรียบร้อยแล้ว'
            : 'ส่งมอบงานเสร็จสิ้นเรียบร้อยแล้ว';
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

  const handleDirectAction = async (bookingId: number, action: BookingAction) => {
    setUpdatingId(bookingId);
    setError(null);

    try {
      await updateBookingStatus(bookingId, action);
      await fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถอัปเดตสถานะการจองได้');
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
              onAction={handleDirectAction}
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
