import { api } from './api';
import type { Booking, BookingAction, BookingStatus } from '../types/booking';

export function getSitterBookings(status?: BookingStatus): Promise<Booking[]> {
  return api.get<Booking[], Booking[]>('/sitter/bookings', {
    params: { status },
  });
}

export function updateBookingStatus(
  bookingId: number,
  action: BookingAction,
): Promise<{ bookingId: number; bookingstatus: BookingStatus }> {
  type BookingStatusUpdate = {
    bookingId: number;
    bookingstatus: BookingStatus;
  };

  return api.patch<BookingStatusUpdate, BookingStatusUpdate>(
    '/sitter/bookings/' + bookingId,
    { action },
  );
}
