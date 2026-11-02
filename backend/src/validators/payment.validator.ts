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
 * Checks whether a buffer starts with valid JPEG, PNG, or WebP magic bytes
 * to prevent client-side MIME type spoofing.
 */
export const hasValidImageMagicBytes = (buffer?: Buffer): boolean => {
  if (!buffer || buffer.length < 4) return false

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true
  }

  // WebP: "RIFF" (0..3) ... "WEBP" (8..11)
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return true
  }

  return false
}

/**
 * Validates payment submit input from multipart form data.
 */
export const validateSubmitPaymentInput = (
  body: Record<string, unknown>,
  file?: Express.Multer.File
): SubmitPaymentDTO => {
  if (!file || !hasValidImageMagicBytes(file.buffer)) {
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
