import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AppError } from '../utils/errors.js';
import { validateCreateBookingInput } from '../validators/booking.validator.js';
import * as bookingService from '../services/booking.service.js';

export const createBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.auth?.userId;
    if (!ownerId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const validatedInput = validateCreateBookingInput(req.body);
    const data = await bookingService.createBooking(ownerId, validatedInput);

    res.status(201).json({ status: 'success', data });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        error: error.errorCode,
        message: error.message,
      });
      return;
    }
    console.error('Error creating booking:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
