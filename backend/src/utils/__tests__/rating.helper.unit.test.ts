import { describe, it, expect } from '@jest/globals'
import { calculateAverageRating } from '../rating.helper.js'

describe('calculateAverageRating (Unit)', () => {
  it('returns null averageRating and 0 reviewCount when input array is empty', () => {
    const result = calculateAverageRating([])
    expect(result).toEqual({ averageRating: null, reviewCount: 0 })
  })

  it('filters out null, undefined, and non-finite scores', () => {
    const result = calculateAverageRating([
      { review_score: null },
      { review_score: undefined },
      { review_score: NaN },
      { review_score: Infinity },
    ])
    expect(result).toEqual({ averageRating: null, reviewCount: 0 })
  })

  it('calculates average for a single review score without rounding', () => {
    const result = calculateAverageRating([{ review_score: 5 }])
    expect(result).toEqual({ averageRating: 5, reviewCount: 1 })
  })

  it('calculates and rounds average to 1 decimal place properly (e.g. 14/3 = 4.666... -> 4.7)', () => {
    const result = calculateAverageRating([
      { review_score: 5 },
      { review_score: 4 },
      { review_score: 5 },
    ])
    expect(result).toEqual({ averageRating: 4.7, reviewCount: 3 })
  })

  it('handles mixed valid and invalid review scores correctly', () => {
    const result = calculateAverageRating([
      { review_score: 5 },
      { review_score: null },
      { review_score: 4 },
      { review_score: undefined },
    ])
    expect(result).toEqual({ averageRating: 4.5, reviewCount: 2 })
  })
})
