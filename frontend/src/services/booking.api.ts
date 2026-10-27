import { api } from './api.js';
import type { Booking, BookingAction, BookingStatus } from '../types/booking';

interface ApiEnvelope<T> {
  status: 'success';
  data: T;
}

interface BookingStatusUpdate {
  bookingId: number;
  bookingstatus: BookingStatus;
}

export async function getSitterBookings(status?: BookingStatus): Promise<Booking[]> {
  const res = await api.get<ApiEnvelope<Booking[]>>('/sitter/bookings', {
    params: { status },
  });
  if (!Array.isArray(res.data.data)) {
    throw new Error('รูปแบบข้อมูลรายการจองไม่ถูกต้อง');
  }
  return res.data.data;
}

export async function updateBookingStatus(
  bookingId: number,
  action: BookingAction,
): Promise<BookingStatusUpdate> {
  const res = await api.patch<ApiEnvelope<BookingStatusUpdate>>(
    `/sitter/bookings/${bookingId}`,
    { action },
  );
  return res.data.data;
}

export async function createBooking(payload: {
  sitterId: number;
  serviceId: number;
  pets: { petId: number; petNote?: string | null }[];
  starttime: string;
  endtime: string;
  paymentplan: 'full' | 'deposit';
  note?: string;
}) {
  const res = await api.post('/bookings', payload);
  return res.data;
}
