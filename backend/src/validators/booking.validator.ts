import { AppError } from '../utils/errors.js'

export const VALID_ACTIONS = ['accept', 'reject', 'complete'] as const
export type SitterBookingAction = (typeof VALID_ACTIONS)[number]

export const VALID_BOOKING_STATUSES = [
  'pending',
  'waiting_payment',
  'deposit_paid',
  'confirmed',
  'rejected',
  'cancelled',
  'waiting_final_payment',
  'completed',
] as const
export type BookingStatusFilter = (typeof VALID_BOOKING_STATUSES)[number]

export interface UpdateBookingStatusInput {
  action: SitterBookingAction
}

/**
 * ตรวจสอบความถูกต้องของ Path param: bookingId
 */
export const validateBookingId = (paramId: unknown): number => {
  const numericId = Number(paramId)
  if (!paramId || !Number.isInteger(numericId) || numericId <= 0) {
    throw new AppError(400, 'INVALID_BOOKING_ID', 'Invalid booking ID')
  }
  return numericId
}

/**
 * ตรวจสอบความถูกต้องของ Request Body สำหรับ PATCH /api/sitter/bookings/:id
 */
export const validateUpdateBookingStatusInput = (body: unknown): UpdateBookingStatusInput => {
  const b = (body ?? {}) as Record<string, unknown>
  const action = typeof b.action === 'string' ? (b.action.trim() as SitterBookingAction) : undefined

  if (!action || !VALID_ACTIONS.includes(action)) {
    throw new AppError(400, 'INVALID_ACTION', 'Invalid action')
  }

  return { action }
}

/**
 * ตรวจสอบความถูกต้องของ Query param: ?status=...
 */
export const validateBookingStatusQuery = (queryStatus: unknown): BookingStatusFilter | undefined => {
  if (queryStatus === undefined || queryStatus === null || queryStatus === '') {
    return undefined
  }

  if (typeof queryStatus === 'string' && VALID_BOOKING_STATUSES.includes(queryStatus as BookingStatusFilter)) {
    return queryStatus as BookingStatusFilter
  }

  throw new AppError(400, 'INVALID_STATUS_FILTER', `Invalid status filter. Allowed values: ${VALID_BOOKING_STATUSES.join(', ')}`)
}
