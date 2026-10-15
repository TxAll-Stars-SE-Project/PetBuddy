import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'

export const getProfileById = async (sitterId: number) => {
  const sitter = await prisma.petsitter.findUnique({
    where: { userid: sitterId },
    include: { USER: true },
  });

  if (!sitter) {
    throw new AppError(404, 'SITTER_NOT_FOUND', 'Sitter not found');
  }

  return {
    sitterId: sitter.userid,
    username: sitter.USER.username,
    province: sitter.USER.province || "",
    rating: 0
  };
};

export const getSitterReviewsById = async (sitterId: number) => {
  const sitter = await prisma.petsitter.findUnique({
    where: { userid: sitterId },
  });
  if (!sitter) throw new AppError(404, 'SITTER_NOT_FOUND', 'Sitter not found');

  const reviews = await prisma.review.findMany({
    where: {
      booking: {
        sitterid: sitterId,
      },
    },
    include: {
      booking: {
        include: {
          petowner: {
            include: {
              USER: true,
            },
          },
        },
      },
    },
    orderBy: { reviewid: 'desc' },
  });

  return reviews.map((r) => ({
    reviewId: r.reviewid,
    rating: r.review_score ?? 0,
    comment: r.review_detail ?? '',
    ownerName: r.booking.petowner.USER.username,
    createdAt: r.booking.bookingdate, // ใช้ bookingdate แทนเพราะตาราง review ยังไม่มี created_at
  }));
};