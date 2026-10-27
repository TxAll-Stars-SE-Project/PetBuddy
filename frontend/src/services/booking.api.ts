import { api } from './api.js';
import type { Booking, BookingAction, BookingStatus } from '../types/booking';

// interface ApiEnvelope<T> {
//   status: 'success';
//   data: T;
// }

interface BookingStatusUpdate {
  bookingId: number;
  bookingstatus: BookingStatus;
}

export async function getSitterBookings(status?: BookingStatus): Promise<Booking[]> {
  const bookings = await api.get<never, Booking[]>('/sitter/bookings', {
    params: { status },
  });
  
  if (!Array.isArray(bookings)) {
    throw new Error('รูปแบบข้อมูลรายการจองไม่ถูกต้อง');
  }
  return bookings;
}

export async function updateBookingStatus(
  bookingId: number,
  action: BookingAction
): Promise<BookingStatusUpdate> {
  return await api.patch<never, BookingStatusUpdate>(
    `/sitter/bookings/${bookingId}`,
    { action }
  );
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
