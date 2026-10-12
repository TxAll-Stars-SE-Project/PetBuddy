import { Response } from 'express'
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js'
import { AppError } from '../../utils/errors.js'
import {
  validateBookingId,
  validateUpdateBookingStatusInput,
  validateBookingStatusQuery,
} from '../../validators/booking.validator.js'
import * as sitterBookingService from '../../services/sitter-booking.service.js'

/**
 * GET /api/sitter/bookings
 * ดึงรายการคำขอจองทั้งหมดของพี่เลี้ยง (รองรับ ?status=...)
 */
export const getSitterBookings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const sitterUserId = req.auth!.userId
    const statusFilter = validateBookingStatusQuery(req.query.status)

    console.log(`[SitterBookingController] GET /api/sitter/bookings called by userId: ${sitterUserId}, statusFilter: ${statusFilter || 'ALL'}`)
    const bookings = await sitterBookingService.getSitterBookings(sitterUserId, statusFilter)
    console.log(`[SitterBookingController] Returning ${bookings.length} bookings for userId: ${sitterUserId}`)

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
    console.error('[SitterBookingController] Error fetching sitter bookings:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}

/**
 * PATCH /api/sitter/bookings/:id
 * อัปเดตสถานะการจอง (action: accept / reject / complete)
 */
export const updateBookingStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const sitterUserId = req.auth!.userId
    const bookingId = validateBookingId(req.params.id)
    const { action } = validateUpdateBookingStatusInput(req.body)

    const result = await sitterBookingService.updateBookingStatusBySitter(
      sitterUserId,
      bookingId,
      action
    )

    res.status(200).json({ status: 'success', data: result })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        error: error.errorCode,
        message: error.message,
      })
      return
    }
    console.error('[SitterBookingController] Error updating booking status:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}
