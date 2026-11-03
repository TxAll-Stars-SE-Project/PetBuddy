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
 * Centralized error response handler for payment controller endpoints.
 */
const handlePaymentControllerError = (
  res: Response,
  error: unknown,
  context: string
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
    return
  }
  console.error(`[PaymentController] ${context}:`, error)
  res.status(500).json({ status: 'error', message: 'Internal server error' })
}

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
    handlePaymentControllerError(res, error, 'Error getting payment summary')
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
    if (!req.file) {
      throw new AppError(400, 'MISSING_FILE', 'กรุณาแนบไฟล์สลิปการชำระเงิน')
    }

    const input = validateSubmitPaymentInput(req.body, req.file)

    const result = await paymentService.submitPaymentSlip(ownerUserId, input, req.file)

    if (input.payment_stage === 'final') {
      const isVerified = result.payment_status === 'verified'
      res.status(201).json({
        success: true,
        message: isVerified
          ? 'ชำระเงินส่วนที่เหลือสำเร็จเรียบร้อยแล้ว'
          : 'ส่งสลิปชำระเงินส่วนที่เหลือสำเร็จ รอพี่เลี้ยงตรวจสอบ',
        data: {
          bookingId: input.bookingId,
          status: isVerified ? 'completed' : (result.bookingstatus || 'waiting_final_payment'),
          paymentId: result.paymentId,
          paymentStatus: result.payment_status,
        },
      })
      return
    }

    res.status(201).json({ success: true, status: 'success', data: result })
  } catch (error) {
    handlePaymentControllerError(res, error, 'Error submitting payment slip')
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
    handlePaymentControllerError(res, error, 'Error verifying payment slip')
  }
}
