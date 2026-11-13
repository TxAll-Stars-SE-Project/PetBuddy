import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { AppError } from '../../utils/errors.js'
import type { SubmitPaymentDTO } from '../../validators/payment.validator.js'

const findUnique = jest.fn<(args: unknown) => Promise<unknown>>()
const prismaMock = {
  booking: { findUnique },
}

jest.unstable_mockModule('../../utils/prisma.js', () => ({ default: prismaMock }))
jest.unstable_mockModule('../../utils/supabase/storage.js', () => ({
  deleteSlipImage: jest.fn(),
  uploadSlipImage: jest.fn(),
}))
jest.unstable_mockModule('../mail.service.js', () => ({
  sendPaymentStatusNotificationEmail: jest.fn(),
}))
jest.unstable_mockModule('../thunder-slip.service.js', () => ({
  verifySlipWithThunder: jest.fn(),
}))

const { submitPaymentSlip, verifyPaymentSlip } = await import('../payment.service.js')

const OWNER_ID = 10
const SITTER_ID = 20
const BOOKING_ID = 7
const PAYMENT_ID = 12

const expectAppError = async (
  promise: Promise<unknown>,
  statusCode: number,
  errorCode: string
) => {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught
  )
  expect(error).toBeInstanceOf(AppError)
  expect((error as AppError).statusCode).toBe(statusCode)
  expect((error as AppError).errorCode).toBe(errorCode)
}

describe('payment service payment-stage guards (Unit)', () => {
  beforeEach(() => {
    findUnique.mockReset()
  })

  it('rejects a full payment stage for a booking waiting for final payment without coercing the input', async () => {
    findUnique.mockResolvedValue({
      ownerid: OWNER_ID,
      bookingstatus: 'waiting_final_payment',
    })
    const input: SubmitPaymentDTO = {
      bookingId: BOOKING_ID,
      amount: 1000,
      payment_stage: 'full',
      paymentType: 'bank_transfer',
    }

    await expectAppError(
      submitPaymentSlip(OWNER_ID, input, {} as Express.Multer.File),
      409,
      'INVALID_BOOKING_STATUS'
    )
    expect(input.payment_stage).toBe('full')
  })

  it('returns PAYMENT_ALREADY_PROCESSED for an already-processed final payment', async () => {
    findUnique.mockResolvedValue({
      sitterid: SITTER_ID,
      bookingstatus: 'completed',
      payment: [{
        paymentid: PAYMENT_ID,
        payment_stage: 'final',
        payment_status: 'verified',
      }],
    })

    await expectAppError(
      verifyPaymentSlip(SITTER_ID, BOOKING_ID, PAYMENT_ID, 'verify'),
      409,
      'PAYMENT_ALREADY_PROCESSED'
    )
  })
})
