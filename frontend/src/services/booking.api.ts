import { api } from './api.js';
import type { Booking, BookingAction, BookingStatus, OwnerBooking } from '../types/booking';

export interface SitterPaymentInfoStatus {
  sitterId: number;
  accountName: string | null;
  qrCodeUrl: string | null;
  hasPaymentInfo: boolean;
}

export async function getSitterPaymentInfo(): Promise<SitterPaymentInfoStatus> {
  const res = await api.get('/sitter/payment-info');
  if (res && typeof res === 'object') {
    const raw = res as unknown as Record<string, unknown>;
    if (raw.data && typeof raw.data === 'object') {
      const inner = raw.data as Record<string, unknown>;
      if (inner.data && typeof inner.data === 'object') {
        return inner.data as SitterPaymentInfoStatus;
      }
      return inner as unknown as SitterPaymentInfoStatus;
    }
  }
  return {
    sitterId: 0,
    accountName: null,
    qrCodeUrl: null,
    hasPaymentInfo: false,
  };
}

export async function getSitterBookings(status?: BookingStatus): Promise<Booking[]> {
  const res = await api.get('/sitter/bookings', {
    params: { status },
  });

  if (Array.isArray(res)) {
    return res;
  }

  if (res && typeof res === 'object') {
    const raw = res as unknown as Record<string, unknown>;
    if (Array.isArray(raw.data)) {
      return raw.data as Booking[];
    }
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

export async function getOwnerBookings(status?: BookingStatus): Promise<OwnerBooking[]> {
  const res = await api.get('/owner/bookings', {
    params: { status },
  });

  if (Array.isArray(res)) {
    return res;
  }

  if (res && typeof res === 'object') {
    const raw = res as unknown as Record<string, unknown>;
    if (Array.isArray(raw.data)) {
      return raw.data as OwnerBooking[];
    }
    if (raw.data && typeof raw.data === 'object') {
      const inner = raw.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) {
        return inner.data as OwnerBooking[];
      }
      if (Array.isArray(inner)) {
        return inner as OwnerBooking[];
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

  try {
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
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const backendMessage = axiosErr?.response?.data?.message || axiosErr?.message || 'ไม่สามารถอัปเดตสถานะการจองได้';
    throw new Error(backendMessage);
  }
}

export async function createBooking(payload: {
  sitterId: number;
  serviceId: number;
  pets: { petId: number; petNote?: string | null }[];
  starttime: string;
  endtime: string;
  paymentplan: 'full' | 'deposit';
  note?: string;
}): Promise<Booking> {
  const res = await api.post('/bookings', payload);
  if (res && typeof res === 'object') {
    const raw = res as unknown as Record<string, unknown>;
    if (raw.data && typeof raw.data === 'object') {
      const inner = raw.data as Record<string, unknown>;
      if (inner.data && typeof inner.data === 'object') {
        return inner.data as Booking;
      }
      return inner as unknown as Booking;
    }
  }
  return res as unknown as Booking;
}
