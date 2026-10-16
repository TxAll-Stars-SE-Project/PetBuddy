import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AppError } from '../utils/errors.js';
import * as bookingService from '../services/booking.service.js';

export const createBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.auth?.userId;
    if (!ownerId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const sitterId = Number(req.body.sitterId);
    const serviceId = Number(req.body.serviceId);
    const { starttime, endtime, paymentplan, pets, note } = req.body;

    if (!sitterId || !serviceId) {
      throw new AppError(400, 'INVALID_INPUT', 'sitterId and serviceId must be valid numbers');
    }

    // Validation
    if (!sitterId || !serviceId || !starttime || !endtime || !paymentplan || !pets || !Array.isArray(pets) || pets.length === 0) {
      throw new AppError(400, 'VALIDATION_FAILED', 'Validation failed. Missing required fields.');
    }

    const data = await bookingService.createBooking(ownerId, req.body);

    res.status(201).json({
      status: 'success',
      data: data
    });

  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: 'error', message: error.message });
      return;
    }
    
    console.error('Error creating booking:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};