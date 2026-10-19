import { Response } from 'express'
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js'
import { AppError } from '../../utils/errors.js'
import { validateBookingStatusQuery } from '../../validators/booking.validator.js'
import * as ownerBookingService from '../../services/owner-booking.service.js'

/**
 * GET /api/owner/bookings
 * ดึงรายการจองทั้งหมดของเจ้าของสัตว์เลี้ยงที่เข้าสู่ระบบ
 */
export const getOwnerBookings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const ownerUserId = req.auth!.userId
    const statusFilter = validateBookingStatusQuery(req.query.status)

    const bookings = await ownerBookingService.getOwnerBookings(ownerUserId, statusFilter)

    res.status(200).json({ status: 'success', data: bookings })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        error: error.errorCode,
        message: error.message,
      })
      return
    }
    console.error('[OwnerBookingController] Error fetching owner bookings:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}
