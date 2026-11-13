import { describe, it, expect } from '@jest/globals'
import { AppError } from '../../utils/errors.js'
import { validateSubmitPaymentInput } from '../payment.validator.js'

const slipFile = {
  buffer: Buffer.from([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xd9]),
  mimetype: 'image/jpeg',
} as Express.Multer.File

const inputWithPaymentStage = (payment_stage: string, payment_type: string) => ({
  bookingId: '1',
  amount: '100',
  payment_stage,
  payment_type,
  paymentType: 'bank_transfer',
})

const captureError = (run: () => unknown): AppError => {
  try {
    run()
  } catch (error) {
    expect(error).toBeInstanceOf(AppError)
    return error as AppError
  }
  throw new Error('Expected validation to throw')
}

describe('validateSubmitPaymentInput (Unit)', () => {
  it.each([
    ['deposit', 'final'],
    ['final', 'deposit'],
  ])('rejects payment_type %s/%s mismatch', (paymentStage, paymentType) => {
    const error = captureError(() =>
      validateSubmitPaymentInput(inputWithPaymentStage(paymentStage, paymentType), slipFile)
    )

    expect(error.errorCode).toBe('PAYMENT_TYPE_STAGE_MISMATCH')
  })
})
