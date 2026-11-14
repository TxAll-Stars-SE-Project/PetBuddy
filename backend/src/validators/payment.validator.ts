import { AppError } from '../utils/errors.js'
import { payment_stage } from '../generated/prisma/enums.js'

export const VALID_PAYMENT_STAGES: payment_stage[] = ['deposit', 'final', 'full']
export type VerifyPaymentAction = 'verify' | 'reject'

export interface SubmitPaymentDTO {
  bookingId: number
  amount: number
  payment_stage: payment_stage
  payment_type?: 'deposit' | 'final'
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

export type CanonicalSlipMimeType = 'image/jpeg' | 'image/png' | 'image/webp'

const normalizeDeclaredSlipMimeType = (mimetype?: string): CanonicalSlipMimeType | null => {
  if (!mimetype) return null
  const normalized = mimetype.trim().toLowerCase()
  if (normalized === 'image/jpeg' || normalized === 'image/jpg' || normalized === 'image/pjpeg') {
    return 'image/jpeg'
  }
  if (normalized === 'image/png') {
    return 'image/png'
  }
  if (normalized === 'image/webp') {
    return 'image/webp'
  }
  return null
}

/**
 * Detects the actual image format from binary magic bytes and validates
 * structural markers (JPEG SOI+EOI, PNG signature+IHDR+IEND, WebP RIFF+size+VP8*).
 */
export const detectAndValidateImageStructure = (
  buffer?: Buffer
): CanonicalSlipMimeType | null => {
  if (!buffer || buffer.length < 12) return null

  // 1. JPEG: starts with SOI (FF D8 FF) and contains/ends with EOI (FF D9)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    // Trim optional trailing null/whitespace padding and verify EOI marker FF D9 exists
    let end = buffer.length - 1
    while (end > 3 && buffer[end] === 0x00) {
      end--
    }
    if (buffer[end - 1] === 0xff && buffer[end] === 0xd9) {
      return 'image/jpeg'
    }
    // Also scan for EOI marker in case metadata/APP trailers follow EOI
    for (let i = buffer.length - 2; i >= 3; i--) {
      if (buffer[i] === 0xff && buffer[i + 1] === 0xd9) {
        return 'image/jpeg'
      }
    }
    return null
  }

  // 2. PNG: 8-byte signature + IHDR chunk (length 13, width > 0, height > 0) + IEND trailer
  if (
    buffer.length >= 33 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    const ihdrLength = buffer.readUInt32BE(8)
    const ihdrType = buffer.subarray(12, 16).toString('ascii')
    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)
    if (ihdrLength !== 13 || ihdrType !== 'IHDR' || width === 0 || height === 0) {
      return null
    }

    // Verify IEND chunk exists near the end of the PNG stream
    const iendMarker = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82])
    if (buffer.indexOf(iendMarker, 29) !== -1) {
      return 'image/png'
    }
    return null
  }

  // 3. WebP: "RIFF" (0..3) + 32-bit LE size (4..7) + "WEBP" (8..11) + valid VP8 chunk (12..15)
  if (
    buffer.length >= 20 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    const riffPayloadSize = buffer.readUInt32LE(4)
    const chunkFourCC = buffer.subarray(12, 16).toString('ascii')
    const validChunks = ['VP8 ', 'VP8L', 'VP8X']
    if (
      riffPayloadSize >= 12 &&
      riffPayloadSize + 8 <= buffer.length &&
      validChunks.includes(chunkFourCC)
    ) {
      return 'image/webp'
    }
    return null
  }

  return null
}

/**
 * Checks whether a buffer has valid JPEG, PNG, or WebP structure and magic bytes.
 * If expectedMimeType is provided, also verifies that the declared MIME matches the actual format.
 */
export const hasValidImageMagicBytes = (
  buffer?: Buffer,
  expectedMimeType?: string
): boolean => {
  const detectedMime = detectAndValidateImageStructure(buffer)
  if (!detectedMime) return false

  if (expectedMimeType !== undefined) {
    const declaredMime = normalizeDeclaredSlipMimeType(expectedMimeType)
    if (!declaredMime || declaredMime !== detectedMime) {
      return false
    }
  }

  return true
}

/**
 * Validates payment submit input from multipart form data.
 */
export const validateSubmitPaymentInput = (
  body: Record<string, unknown>,
  file?: Express.Multer.File
): SubmitPaymentDTO => {
  if (!file || !hasValidImageMagicBytes(file.buffer, file.mimetype)) {
    throw new AppError(400, 'MISSING_FILE', 'Invalid file type or size / missing fields')
  }

  const { bookingId, amount, payment_stage: stage, payment_type: paymentTypeByStage, paymentType } = body

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

  let normalizedPaymentStageType: 'deposit' | 'final' | undefined
  if (paymentTypeByStage !== undefined && paymentTypeByStage !== null && paymentTypeByStage !== '') {
    const paymentTypeValue = String(paymentTypeByStage).trim()
    if (paymentTypeValue !== 'deposit' && paymentTypeValue !== 'final') {
      throw new AppError(400, 'INVALID_PAYMENT_TYPE', 'payment_type must be deposit or final')
    }
    normalizedPaymentStageType = paymentTypeValue

    if (
      (normalizedPaymentStageType === 'final' && normalizedStage !== 'final')
      || (normalizedPaymentStageType === 'deposit' && normalizedStage !== 'deposit')
    ) {
      throw new AppError(400, 'PAYMENT_TYPE_STAGE_MISMATCH', 'payment_type does not match payment_stage')
    }
  }

  const normalizedPaymentType = paymentType ? String(paymentType).trim() : 'bank_transfer'
  if (!normalizedPaymentType) {
    throw new AppError(400, 'INVALID_PAYMENT_TYPE', 'Invalid file type or size / missing fields')
  }

  return {
    bookingId: parsedBookingId,
    amount: parsedAmount,
    payment_stage: normalizedStage,
    payment_type: normalizedPaymentStageType,
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
