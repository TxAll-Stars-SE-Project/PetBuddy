import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.middleware.js'
import { AppError } from '../utils/errors.js'
import { validateBookingId } from '../validators/booking.validator.js'
import { validateCreateCareReportInput } from '../validators/careReport.validator.js'
import * as careReportService from '../services/care-report.service.js'

/**
 * POST /api/bookings/:bookingId/reports
 * พี่เลี้ยงส่งรายงานการดูแลสัตว์เลี้ยง (บันทึกกิจกรรม + รูปถ่ายไม่บังคับ) ระหว่างให้บริการ (US7-3)
 */
export const createCareReport = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const sitterId = req.auth!.userId
    const bookingId = validateBookingId(req.params.bookingId)
    const input = validateCreateCareReportInput(req.body)

    const data = await careReportService.createCareReport(sitterId, bookingId, input, req.file)

    res.status(201).json({ status: 'success', data })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        error: error.errorCode,
        message: error.message,
      })
      return
    }
    console.error('[CareReportController] Error creating care report:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}
