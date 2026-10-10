import { useCallback, useEffect, useMemo, useState } from 'react';
import SitterBookingCard from './SitterBookingCard';
import { getSitterBookings, updateBookingStatus } from '../../services/booking.api';
import type { Booking, BookingAction, BookingStatus } from '../../types/booking';
import './SitterBookingList.css';

type BookingTab = 'ALL' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const statusGroups: Record<Exclude<BookingTab, 'ALL'>, BookingStatus[]> = {
  pending: ['pending'],
  confirmed: ['waiting_payment', 'deposit_paid', 'confirmed', 'waiting_final_payment'],
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

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getSitterBookings();
      setBookings(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลการจองได้');
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

  const handleAction = async (bookingId: number, action: BookingAction) => {
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
              onAction={handleAction}
              isUpdating={updatingId === booking.bookingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
