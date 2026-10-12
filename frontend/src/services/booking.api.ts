import { api } from './api';
import type { Booking, BookingAction, BookingStatus } from '../types/booking';

export async function getSitterBookings(status?: BookingStatus): Promise<Booking[]> {
  const res = await api.get('/sitter/bookings', {
    params: { status },
  });

  // รองรับทั้ง Response ที่มาจาก Axios ปกติ (res.data.data) และแบบที่แกะ Envelope แล้ว (res.data หรือ res)
  if (Array.isArray(res)) {
    return res;
  }

  if (res && typeof res === 'object') {
    const raw = res as unknown as Record<string, unknown>;
    // กรณี res.data เป็น array ตรงๆ
    if (Array.isArray(raw.data)) {
      return raw.data as Booking[];
    }
    // กรณี res.data เป็น envelope { status: 'success', data: [...] } -> raw.data.data
    if (raw.data && typeof raw.data === 'object') {
      const inner = raw.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) {
        return inner.data as Booking[];
      }
      if (Array.isArray(inner)) {
        return inner as Booking[];
      }
    }
  }

  return [];
}

export async function updateBookingStatus(
  bookingId: number,
  action: BookingAction,
): Promise<{ bookingId: number; bookingstatus: BookingStatus }> {
  type BookingStatusUpdate = {
    bookingId: number;
    bookingstatus: BookingStatus;
  };

  const res = await api.patch('/sitter/bookings/' + bookingId, { action });

  if (res && typeof res === 'object') {
    const raw = res as unknown as Record<string, unknown>;
    if (raw.data && typeof raw.data === 'object') {
      const inner = raw.data as Record<string, unknown>;
      if (inner.data && typeof inner.data === 'object') {
        return inner.data as BookingStatusUpdate;
      }
      return inner as BookingStatusUpdate;
    }
    return raw as BookingStatusUpdate;
  }

  return res as BookingStatusUpdate;
}
