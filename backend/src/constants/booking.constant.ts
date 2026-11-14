import { booking_status } from '../generated/prisma/enums.js'

/**
 * Statuses considered as active bookings (blocking time slots from being double-booked,
 * showing sitter as busy, and preventing service from being deleted/archived).
 */
export const ACTIVE_BOOKING_STATUSES: booking_status[] = [
  'pending',
  'waiting_payment',
  'deposit_paid',
  'confirmed',
  'in_progress',
  'waiting_final_payment',
]

/**
 * Statuses from which a Pet Owner may cancel their own booking (US 6-3).
 * Cancelling after the deposit is paid (deposit_paid) is allowed but the deposit is not refunded.
 */
export const OWNER_CANCELLABLE_BOOKING_STATUSES: booking_status[] = [
  'pending',
  'waiting_payment',
  'deposit_paid',
]


export const EARLY_START_BUFFER_MINUTES = 5;