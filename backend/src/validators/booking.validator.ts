import { AppError } from '../utils/errors.js'

export const VALID_ACTIONS = ['accept', 'reject', 'start', 'complete'] as const
export type SitterBookingAction = (typeof VALID_ACTIONS)[number]

export const VALID_BOOKING_STATUSES = [
  'pending',
  'waiting_payment',
  'deposit_paid',
  'confirmed',
  'in_progress',
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

export const VALID_PAYMENT_PLANS = ['full', 'deposit'] as const
export type PaymentPlanInput = (typeof VALID_PAYMENT_PLANS)[number]

export interface ValidatedPetBookingItem {
  petId: number
  petNote?: string
}

export interface ValidatedCreateBookingInput {
  sitterId: number
  serviceId: number
  starttime: string
  endtime: string
  paymentplan: PaymentPlanInput
  note?: string
  pets: ValidatedPetBookingItem[]
}

/**
 * ตรวจสอบความถูกต้องของ Request Body สำหรับ POST /api/bookings (US 5-1)
 */
export const validateCreateBookingInput = (
  body: unknown,
  now: Date = new Date()
): ValidatedCreateBookingInput => {
  const b = (body ?? {}) as Record<string, unknown>

  const sitterId = Number(b.sitterId)
  const serviceId = Number(b.serviceId)
  const starttime = typeof b.starttime === 'string' ? b.starttime.trim() : ''
  const endtime = typeof b.endtime === 'string' ? b.endtime.trim() : ''
  const paymentplan = typeof b.paymentplan === 'string' ? b.paymentplan.trim() : ''
  const rawPets = b.pets
  const note =
    typeof b.note === 'string' && b.note.trim().length > 0 ? b.note.trim() : undefined

  if (
    !Number.isInteger(sitterId) ||
    sitterId <= 0 ||
    !Number.isInteger(serviceId) ||
    serviceId <= 0 ||
    !starttime ||
    !endtime ||
    !paymentplan ||
    !Array.isArray(rawPets) ||
    rawPets.length === 0
  ) {
    throw new AppError(400, 'VALIDATION_FAILED', 'Validation failed')
  }

  if (!VALID_PAYMENT_PLANS.includes(paymentplan as PaymentPlanInput)) {
    throw new AppError(
      400,
      'INVALID_PAYMENT_PLAN',
      `Invalid paymentplan. Allowed values: ${VALID_PAYMENT_PLANS.join(', ')}`
    )
  }

  const start = new Date(starttime)
  const end = new Date(endtime)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError(400, 'INVALID_TIME', 'Invalid start or end time format')
  }

  if (start < now) {
    throw new AppError(400, 'INVALID_TIME', 'Cannot book in the past')
  }

  if (end <= start) {
    throw new AppError(400, 'INVALID_TIME', 'End time must be after start time')
  }

  const pets: ValidatedPetBookingItem[] = rawPets.map((item) => {
    const p = (item ?? {}) as Record<string, unknown>
    const petId = Number(p.petId)
    if (!Number.isInteger(petId) || petId <= 0) {
      throw new AppError(400, 'INVALID_PET_ID', 'Each pet must have a valid positive integer petId')
    }
    const petNote =
      typeof p.petNote === 'string' && p.petNote.trim().length > 0
        ? p.petNote.trim()
        : undefined
    return { petId, petNote }
  })

  const uniquePetIds = new Set(pets.map((p) => p.petId))
  if (uniquePetIds.size !== pets.length) {
    throw new AppError(400, 'INVALID_INPUT', 'Duplicate pet IDs are not allowed')
  }

  return {
    sitterId,
    serviceId,
    starttime,
    endtime,
    paymentplan: paymentplan as PaymentPlanInput,
    note,
    pets,
  }
}

/**
 * คำนวณจำนวนชั่วโมง ราคารวม และยอดมัดจำ 30% (ปัดเศษทศนิยม 2 ตำแหน่ง)
 */
export const calculateBookingAmounts = (
  servicePrice: number,
  start: Date,
  end: Date,
  petCount: number,
  depositRate = 0.3
): { hours: number; totalPrice: number; depositAmount: number } => {
  const durationMs = end.getTime() - start.getTime()
  if (Number.isNaN(durationMs) || durationMs <= 0) {
    throw new AppError(400, 'INVALID_TIME', 'End time must be after start time')
  }

  const hours = Math.ceil(durationMs / (1000 * 60 * 60))
  const totalPrice = Math.round(servicePrice * hours * petCount * 100) / 100
  const depositAmount = Math.round(totalPrice * depositRate * 100) / 100

  return { hours, totalPrice, depositAmount }
}

