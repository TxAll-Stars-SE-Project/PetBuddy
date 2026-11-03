import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'

export const createBookingReview = async (
  ownerId: number,
  body: Record<string, unknown>,
) => {
  const bookingId = body?.bookingId
  const rating = body?.rating
  const rawComment = body?.comment

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
  if (comment && comment.length > 200) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Comment must not exceed 200 characters')
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingid: bookingId },
  })

  if (!booking) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found')
  }

  if (booking.ownerid !== ownerId) {
    throw new AppError(403, 'FORBIDDEN', 'Only the owner of this booking can review')
  }

  if (booking.bookingstatus !== 'completed') {
    throw new AppError(409, 'BOOKING_NOT_COMPLETED', 'Booking is not completed')
  }

  const existingReview = await prisma.review.findFirst({
    where: { bookingid: bookingId },
  })

  if (existingReview) {
    throw new AppError(409, 'ALREADY_REVIEWED', 'Booking has already been reviewed')
  }

  const created = await prisma.review.create({
    data: {
      bookingid: bookingId,
      review_score: rating,
      review_detail: comment,
    },
  })

  return {
    reviewId: created.reviewid,
    bookingId: created.bookingid,
    rating: created.review_score,
    comment: created.review_detail ?? '',
  }
}
