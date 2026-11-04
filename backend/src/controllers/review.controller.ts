import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.middleware.js'
import { AppError } from '../utils/errors.js'
import * as reviewService from '../services/review.service.js'

export const createReview = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const ownerId = req.auth?.userId
    if (!ownerId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' })
      return
    }

    const data = await reviewService.createBookingReview(ownerId, req.body ?? {})
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
    console.error('Error creating review:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}
