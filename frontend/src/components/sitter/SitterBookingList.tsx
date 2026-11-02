import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SitterBookingCard from './SitterBookingCard';
import BookingConfirmModal from './BookingConfirmModal';
import {
  getSitterBookings,
  getSitterPaymentInfo,
  updateBookingStatus,
} from '../../services/booking.api';
import { toast } from '../../utils/toast';
import {
  isStartTimeReached,
  type Booking,
  type BookingAction,
  type BookingStatus,
} from '../../types/booking';
import './SitterBookingList.css';

type BookingTab = 'ALL' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

const statusGroups: Record<Exclude<BookingTab, 'ALL'>, BookingStatus[]> = {
  pending: ['pending'],
  confirmed: ['waiting_payment', 'deposit_paid', 'confirmed'],
  in_progress: ['in_progress', 'waiting_final_payment'],
  completed: ['completed'],
  cancelled: ['rejected', 'cancelled'],
};

const tabs: { id: BookingTab; label: string }[] = [
  { id: 'ALL', label: 'ทั้งหมด' },
  { id: 'pending', label: 'คำขอใหม่' },
  { id: 'confirmed', label: 'ยืนยันแล้ว' },
  { id: 'in_progress', label: 'กำลังดูแล' },
  { id: 'completed', label: 'สำเร็จ' },
  { id: 'cancelled', label: 'ยกเลิก/ปฏิเสธ' },
];

export default function SitterBookingList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<BookingTab>('ALL');
  const [hasPaymentInfo, setHasPaymentInfo] = useState<boolean | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    booking: Booking;
    action: BookingAction;
  } | null>(null);

  const recentUpdatedStatusRef = useRef<Map<number, { status: BookingStatus; timestamp: number }>>(
    new Map(),
  );

  const fetchBookingsAndPaymentInfo = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const [list, paymentInfo] = await Promise.all([
        getSitterBookings(),
        getSitterPaymentInfo().catch(() => null),
      ]);

      const now = Date.now();
      const rawList = Array.isArray(list) ? list : [];

      // Merge Guard: ป้องกันไม่ให้การอ่านข้อมูลเก่า (Stale Read) มาเขียนทับสถานะที่เพิ่งอัปเดตไป
      const reconciledList = rawList.map((item) => {
        const recent = recentUpdatedStatusRef.current.get(item.bookingId);
        if (recent) {
          // หากอัปเดตไปไม่เกิน 5 วินาที และสถานะจาก Server ยังเป็นสถานะเก่า ให้คงสถานะใหม่ล่าสุดไว้
          if (now - recent.timestamp < 5000 && item.bookingstatus !== recent.status) {
            return { ...item, bookingstatus: recent.status };
          }
          recentUpdatedStatusRef.current.delete(item.bookingId);
        }
        return item;
      });

      setBookings(reconciledList);
      if (paymentInfo !== null) {
        setHasPaymentInfo(Boolean(paymentInfo.hasPaymentInfo));
      }
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลการจองได้');
        setBookings([]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchBookingsAndPaymentInfo();
  }, [fetchBookingsAndPaymentInfo]);

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
    // บังคับต้องตั้งค่าชื่อบัญชีรับเงินและ QR Code ก่อนกดรับงาน (US 2-2 & US 6-2)
    if (action === 'accept' && hasPaymentInfo === false) {
      toast(
        'กรุณาตั้งค่าชื่อบัญชีรับเงินและอัปโหลด QR Code ในหน้าโปรไฟล์ก่อนกดรับงาน',
        'error',
      );
      return;
    }

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

    if (action === 'start' && !isStartTimeReached(booking.starttime)) {
      toast('ยังไม่ถึงเวลาเริ่มงานตามนัดหมาย ไม่สามารถเริ่มงานก่อนกำหนดได้', 'error');
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
      const res = await updateBookingStatus(booking.bookingId, action);
      const nextStatus: BookingStatus =
        res?.bookingstatus ??
        (action === 'accept'
          ? 'waiting_payment'
          : action === 'reject'
            ? 'rejected'
            : 'waiting_final_payment');

      // บันทึกลง Merge Guard เพื่อป้องกัน Race Condition จากการ Refetch ซ้ำในเบื้องหลัง
      recentUpdatedStatusRef.current.set(booking.bookingId, {
        status: nextStatus,
        timestamp: Date.now(),
      });

      // อัปเดต State รายการทันทีจากผลลัพธ์ของ PATCH โดยตรง (ไม่ต้องรอผล GET และไม่เกิด Race Condition)
      setBookings((prev) =>
        prev.map((item) =>
          item.bookingId === booking.bookingId
            ? { ...item, bookingstatus: nextStatus }
            : item,
        ),
      );

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

      // หน่วงเวลาสั้นๆ ก่อนทำ Silent Background Refetch เพื่อซิงก์ข้อมูลโดยไม่ทำให้หน้าจอกระพริบ
      setTimeout(() => {
        void fetchBookingsAndPaymentInfo({ silent: true });
      }, 500);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'ไม่สามารถอัปเดตสถานะการจองได้';
      toast(errMsg, 'error');
      setConfirmTarget(null);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="sitter-booking-list">
      {hasPaymentInfo === false && (
        <div className="sitter-booking-list__payment-warning" role="alert">
          <div className="sitter-booking-list__payment-warning-body">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>คุณยังไม่ได้ตั้งค่าบัญชีรับเงินและ QR Code</strong>
              <p>
                จำเป็นต้องระบุชื่อบัญชีผู้รับเงินและอัปโหลดรูป QR Code ก่อน จึงจะสามารถกดรับงานคำขอจองได้
              </p>
            </div>
          </div>
          <Link to="/profile" className="sitter-booking-list__payment-warning-btn">
            ไปตั้งค่าที่หน้าโปรไฟล์
          </Link>
        </div>
      )}

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
          <button type="button" onClick={() => void fetchBookingsAndPaymentInfo()}>
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
