import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.middleware.js'
import { AppError } from '../utils/errors.js'
import { validateBookingId } from '../validators/booking.validator.js'
import * as paymentService from '../services/payment.service.js'

/**
 * GET /api/bookings/:bookingId/payments
 * สรุปยอดที่ต้องชำระของการจอง (เจ้าของสัตว์เลี้ยงหรือพี่เลี้ยงของการจองนั้น)
 */
export const getPaymentSummary = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.auth!.userId
    const bookingId = validateBookingId(req.params.bookingId)

    const summary = await paymentService.getPaymentSummary(userId, bookingId)

    res.status(200).json({ status: 'success', data: summary })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        error: error.errorCode,
        message: error.message,
      })
      return
    }
    console.error('[PaymentController] Error fetching payment summary:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}
