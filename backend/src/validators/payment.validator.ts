import { AppError } from '../utils/errors.js'
import { payment_stage } from '../generated/prisma/enums.js'

export const VALID_PAYMENT_STAGES: payment_stage[] = ['deposit', 'final', 'full']
export type VerifyPaymentAction = 'verify' | 'reject'

export interface SubmitPaymentDTO {
  bookingId: number
  amount: number
  payment_stage: payment_stage
  paymentType: string
}

export interface VerifyPaymentDTO {
  paymentId: number
  action: VerifyPaymentAction
}

/**
 * Validates booking ID from route parameter.
 */
export const validateBookingId = (idParam: unknown): number => {
  if (idParam === undefined || idParam === null || idParam === '') {
    throw new AppError(400, 'INVALID_BOOKING_ID', 'Invalid or missing booking ID')
  }

  const bookingId = Number(idParam)
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    throw new AppError(400, 'INVALID_BOOKING_ID', 'Booking ID must be a positive integer')
  }

  return bookingId
}

/**
 * Validates payment submit input from multipart form data.
 */
export const validateSubmitPaymentInput = (
  body: Record<string, unknown>,
  file?: Express.Multer.File
): SubmitPaymentDTO => {
  if (!file) {
    throw new AppError(400, 'MISSING_FILE', 'Invalid file type or size / missing fields')
  }

  const { bookingId, amount, payment_stage: stage, paymentType } = body

  if (!bookingId || !amount || !stage) {
    throw new AppError(400, 'MISSING_FIELDS', 'Invalid file type or size / missing fields')
  }

  const parsedBookingId = Number(bookingId)
  if (!Number.isInteger(parsedBookingId) || parsedBookingId <= 0) {
    throw new AppError(400, 'INVALID_BOOKING_ID', 'Invalid file type or size / missing fields')
  }

  const parsedAmount = Number(amount)
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new AppError(400, 'INVALID_AMOUNT', 'Invalid file type or size / missing fields')
  }

  const normalizedStage = String(stage).trim() as payment_stage
  if (!VALID_PAYMENT_STAGES.includes(normalizedStage)) {
    throw new AppError(400, 'INVALID_STAGE', 'Invalid file type or size / missing fields')
  }

  const normalizedPaymentType = paymentType ? String(paymentType).trim() : 'bank_transfer'
  if (!normalizedPaymentType) {
    throw new AppError(400, 'INVALID_PAYMENT_TYPE', 'Invalid file type or size / missing fields')
  }

  return {
    bookingId: parsedBookingId,
    amount: parsedAmount,
    payment_stage: normalizedStage,
    paymentType: normalizedPaymentType,
  }
}

/**
 * Validates verify payment slip input from sitter.
 */
export const validateVerifyPaymentInput = (body: Record<string, unknown>): VerifyPaymentDTO => {
  if (!body || typeof body !== 'object') {
    throw new AppError(400, 'INVALID_BODY', 'Invalid action')
  }

  const { paymentId, action } = body

  const parsedPaymentId = Number(paymentId)
  if (!Number.isInteger(parsedPaymentId) || parsedPaymentId <= 0) {
    throw new AppError(400, 'INVALID_PAYMENT_ID', 'Invalid action')
  }

  if (action !== 'verify' && action !== 'reject') {
    throw new AppError(400, 'INVALID_ACTION', 'Invalid action')
  }

  return {
    paymentId: parsedPaymentId,
    action: action as VerifyPaymentAction,
  }
}
