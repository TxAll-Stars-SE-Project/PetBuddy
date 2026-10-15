import { Response } from 'express'
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js'
import { AppError } from '../../utils/errors.js'
import {
  validateBookingId,
  validateSubmitPaymentInput,
  validateVerifyPaymentInput,
} from '../../validators/payment.validator.js'
import * as paymentService from '../../services/payment.service.js'

/**
 * GET /api/bookings/:bookingID/payments
 * ดึงสรุปยอดชำระเงินและประวัติสลิปของการจอง
 */
export const getPaymentSummaryController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.auth!.userId
    const bookingId = validateBookingId(req.params.bookingID || req.params.id)

    const summary = await paymentService.getPaymentSummary(userId, bookingId)

    res.status(200).json({ status: 'success', data: summary })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      })
      return
    }
    console.error('[PaymentController] Error getting payment summary:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}

/**
 * POST /api/payments
 * อัปโหลดสลิปการโอนเงิน (multipart/form-data)
 */
export const submitPaymentSlipController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const ownerUserId = req.auth!.userId
    const input = validateSubmitPaymentInput(req.body, req.file)

    const result = await paymentService.submitPaymentSlip(ownerUserId, input, req.file!)

    res.status(201).json({ status: 'success', data: result })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      })
      return
    }
    console.error('[PaymentController] Error submitting payment slip:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}

/**
 * PATCH /api/bookings/:bookingID/verify-payment
 * พี่เลี้ยงตรวจสอบและยืนยันหรือปฏิเสธสลิปการโอนเงิน
 */
export const verifyPaymentSlipController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const sitterUserId = req.auth!.userId
    const bookingId = validateBookingId(req.params.bookingID || req.params.id)
    const { paymentId, action } = validateVerifyPaymentInput(req.body)

    const result = await paymentService.verifyPaymentSlip(
      sitterUserId,
      bookingId,
      paymentId,
      action
    )

    res.status(200).json({ status: 'success', data: result })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      })
      return
    }
    console.error('[PaymentController] Error verifying payment slip:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}
