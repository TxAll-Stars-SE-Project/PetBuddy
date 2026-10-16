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

    const { starttime, endtime, paymentplan, pets, note } = req.body;
    const sitterId = Number(req.body.sitterId);
    const serviceId = Number(req.body.serviceId);

    // เช็คความถูกต้องของข้อมูลทั้งหมด
    if (
      !Number.isInteger(sitterId) || sitterId <= 0 ||
      !Number.isInteger(serviceId) || serviceId <= 0 ||
      !starttime || !endtime || !paymentplan ||
      !Array.isArray(pets) || pets.length === 0
    ) {
      throw new AppError(400, 'VALIDATION_FAILED', 'Missing or invalid required fields');
    }

    const data = await bookingService.createBooking(ownerId, {
      sitterId,
      serviceId,
      starttime,
      endtime,
      paymentplan,
      pets,
      note,
    });

    res.status(201).json({ status: 'success', data });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: 'error', message: error.message });
      return;
    }
    console.error('Error creating booking:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};