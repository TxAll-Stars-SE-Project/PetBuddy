import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { validateCreateReviewInput } from '../validators/review.validator.js'

export const createBookingReview = async (
  ownerId: number,
  body: Record<string, unknown>,
) => {
  const { bookingId, rating, comment } = validateCreateReviewInput(body)

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
