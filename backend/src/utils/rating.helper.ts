export interface ReviewScoreItem {
  review_score?: number | null
}

export interface AverageRatingResult {
  averageRating: number | null
  reviewCount: number
}

export const calculateAverageRating = (reviews: ReviewScoreItem[]): AverageRatingResult => {
  const scored = reviews.filter(
    (r): r is ReviewScoreItem & { review_score: number } =>
      typeof r.review_score === 'number' && Number.isFinite(r.review_score)
  )

  const reviewCount = scored.length
  if (reviewCount === 0) {
    return { averageRating: null, reviewCount: 0 }
  }

  const sum = scored.reduce((total, r) => total + r.review_score, 0)
  const averageRating = Math.round((sum / reviewCount) * 10) / 10

  return { averageRating, reviewCount }
}
