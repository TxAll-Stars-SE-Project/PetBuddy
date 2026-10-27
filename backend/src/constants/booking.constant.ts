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
