import { describe, it, expect } from '@jest/globals'
import { AppError } from '../../utils/errors.js'
import { validateCreateReviewInput } from '../review.validator.js'

describe('validateCreateReviewInput (Unit)', () => {
  it('throws 400 when body is not an object or is null', () => {
    expect(() => validateCreateReviewInput(null)).toThrow(AppError)
    expect(() => validateCreateReviewInput('string')).toThrow(AppError)
    expect(() => validateCreateReviewInput(123)).toThrow(AppError)
    expect(() => validateCreateReviewInput(undefined)).toThrow(AppError)
  })

  it('throws 400 when bookingId is missing, not a number, not an integer, or <= 0', () => {
    expect(() => validateCreateReviewInput({})).toThrow(
      'bookingId is required and must be a positive integer'
    )
    expect(() => validateCreateReviewInput({ bookingId: '1' })).toThrow(
      'bookingId is required and must be a positive integer'
    )
    expect(() => validateCreateReviewInput({ bookingId: 1.5 })).toThrow(
      'bookingId is required and must be a positive integer'
    )
    expect(() => validateCreateReviewInput({ bookingId: 0 })).toThrow(
      'bookingId is required and must be a positive integer'
    )
    expect(() => validateCreateReviewInput({ bookingId: -5 })).toThrow(
      'bookingId is required and must be a positive integer'
    )
  })

  it('throws 400 when rating is missing, not a number, not an integer, or outside 1..5', () => {
    expect(() => validateCreateReviewInput({ bookingId: 1 })).toThrow(
      'Rating must be an integer between 1 and 5'
    )
    expect(() => validateCreateReviewInput({ bookingId: 1, rating: '5' })).toThrow(
      'Rating must be an integer between 1 and 5'
    )
    expect(() => validateCreateReviewInput({ bookingId: 1, rating: 4.2 })).toThrow(
      'Rating must be an integer between 1 and 5'
    )
    expect(() => validateCreateReviewInput({ bookingId: 1, rating: 0 })).toThrow(
      'Rating must be an integer between 1 and 5'
    )
    expect(() => validateCreateReviewInput({ bookingId: 1, rating: 6 })).toThrow(
      'Rating must be an integer between 1 and 5'
    )
  })

  it('throws 400 when comment is defined and non-null but not a string', () => {
    expect(() =>
      validateCreateReviewInput({ bookingId: 1, rating: 5, comment: 12345 })
    ).toThrow('Comment must be a string')
    expect(() =>
      validateCreateReviewInput({ bookingId: 1, rating: 5, comment: true })
    ).toThrow('Comment must be a string')
    expect(() =>
      validateCreateReviewInput({ bookingId: 1, rating: 5, comment: {} })
    ).toThrow('Comment must be a string')
  })

  it('throws 400 when comment string exceeds 200 characters', () => {
    const longComment = 'a'.repeat(201)
    expect(() =>
      validateCreateReviewInput({ bookingId: 1, rating: 5, comment: longComment })
    ).toThrow('Comment must not exceed 200 characters')
  })

  it('accepts valid input without comment (undefined / null)', () => {
    const res1 = validateCreateReviewInput({ bookingId: 10, rating: 5 })
    expect(res1).toEqual({ bookingId: 10, rating: 5, comment: null })

    const res2 = validateCreateReviewInput({ bookingId: 10, rating: 5, comment: null })
    expect(res2).toEqual({ bookingId: 10, rating: 5, comment: null })
  })

  it('accepts valid input with valid trimmed comment <= 200 characters', () => {
    const res = validateCreateReviewInput({
      bookingId: 15,
      rating: 4,
      comment: '  บริการดีมากครับ ใส่ใจสัตว์เลี้ยง  ',
    })
    expect(res).toEqual({
      bookingId: 15,
      rating: 4,
      comment: 'บริการดีมากครับ ใส่ใจสัตว์เลี้ยง',
    })
  })
})
