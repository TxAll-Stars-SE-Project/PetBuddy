import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.middleware.js'
import { AppError } from '../utils/errors.js'
import * as bookingService from '../services/booking.service.js'

export const createBooking = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const ownerUserId = req.auth!.userId
    const { sitterId, serviceId, petIds, starttime, endtime, paymentplan, note } = req.body

    const newBooking = await bookingService.createBooking(ownerUserId, {
      sitterId,
      serviceId,
      petIds,
      starttime,
      endtime,
      paymentplan,
      note,
    })

    res.status(201).json({ status: 'success', data: newBooking })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        error: error.errorCode,
        message: error.message,
      })
      return
    }
    console.error('Error creating booking:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}