import { test, describe } from 'node:test'
import assert from 'node:assert'
import {
  validateBookingId,
  validateUpdateBookingStatusInput,
  validateBookingStatusQuery,
} from '../booking.validator.js'
import { AppError } from '../../utils/errors.js'

describe('Booking Validator Tests', () => {
  describe('validateBookingId', () => {
    test('should return numeric id for valid positive integer', () => {
      assert.strictEqual(validateBookingId('123'), 123)
      assert.strictEqual(validateBookingId(456), 456)
    })

    test('should throw 400 for negative, zero or non-numeric id', () => {
      assert.throws(() => validateBookingId('0'), (err: AppError) => err.statusCode === 400 && err.errorCode === 'INVALID_BOOKING_ID')
      assert.throws(() => validateBookingId('-5'), (err: AppError) => err.statusCode === 400 && err.errorCode === 'INVALID_BOOKING_ID')
      assert.throws(() => validateBookingId('abc'), (err: AppError) => err.statusCode === 400 && err.errorCode === 'INVALID_BOOKING_ID')
      assert.throws(() => validateBookingId(null), (err: AppError) => err.statusCode === 400 && err.errorCode === 'INVALID_BOOKING_ID')
    })
  })

  describe('validateUpdateBookingStatusInput', () => {
    test('should accept valid actions: accept, reject, complete', () => {
      assert.deepStrictEqual(validateUpdateBookingStatusInput({ action: 'accept' }), { action: 'accept' })
      assert.deepStrictEqual(validateUpdateBookingStatusInput({ action: 'reject' }), { action: 'reject' })
      assert.deepStrictEqual(validateUpdateBookingStatusInput({ action: 'complete' }), { action: 'complete' })
    })

    test('should throw 400 for invalid action', () => {
      assert.throws(() => validateUpdateBookingStatusInput({ action: 'cancel' }), (err: AppError) => err.statusCode === 400 && err.errorCode === 'INVALID_ACTION')
      assert.throws(() => validateUpdateBookingStatusInput({}), (err: AppError) => err.statusCode === 400 && err.errorCode === 'INVALID_ACTION')
    })
  })

  describe('validateBookingStatusQuery', () => {
    test('should return undefined when query is empty, undefined or null', () => {
      assert.strictEqual(validateBookingStatusQuery(undefined), undefined)
      assert.strictEqual(validateBookingStatusQuery(''), undefined)
      assert.strictEqual(validateBookingStatusQuery(null), undefined)
    })

    test('should accept valid booking status filter', () => {
      assert.strictEqual(validateBookingStatusQuery('pending'), 'pending')
      assert.strictEqual(validateBookingStatusQuery('waiting_payment'), 'waiting_payment')
      assert.strictEqual(validateBookingStatusQuery('confirmed'), 'confirmed')
      assert.strictEqual(validateBookingStatusQuery('completed'), 'completed')
    })

    test('should throw 400 for invalid status query', () => {
      assert.throws(() => validateBookingStatusQuery('unknown_status'), (err: AppError) => err.statusCode === 400 && err.errorCode === 'INVALID_STATUS_FILTER')
    })
  })
})
