import { AppError } from '../utils/errors.js'

export interface CreateReviewInput {
  bookingId: number
  rating: number
  comment: string | null
}

export const validateCreateReviewInput = (body: unknown): CreateReviewInput => {
  if (typeof body !== 'object' || body === null) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Request body must be an object')
  }

  const { bookingId, rating, comment: rawComment } = body as Record<string, unknown>

  if (typeof bookingId !== 'number' || !Number.isInteger(bookingId) || bookingId <= 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'bookingId is required and must be a positive integer')
  }

  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Rating must be an integer between 1 and 5')
  }

  if (rawComment !== undefined && rawComment !== null && typeof rawComment !== 'string') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Comment must be a string')
  }

  const comment = typeof rawComment === 'string' ? rawComment.trim() : null
  if (comment !== null && comment.length > 200) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Comment must not exceed 200 characters')
  }

  return { bookingId, rating, comment }
}
