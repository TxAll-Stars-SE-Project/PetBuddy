import { Request, Response } from 'express';
import { AppError } from '../../utils/errors.js';
import * as sitterService from '../../services/sitter.service.js'; 

export const getSitterProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const sitterId = Number(req.params.sitterID);
    if (!Number.isInteger(sitterId) || sitterId <= 0) {
      throw new AppError(400, 'INVALID_ID', 'Invalid Sitter ID');
    }

    const profile = await sitterService.getProfileById(sitterId);

    res.status(200).json({ status: 'success', data: profile });
  } catch (error) {
    // แพทเทิร์นจัดการ Error ของทีม
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.errorCode, message: error.message });
      return;
    }
    console.error('Error getting sitter profile:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const getSitterReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const sitterId = Number(req.params.sitterID);
    if (!Number.isInteger(sitterId) || sitterId <= 0) {
      throw new AppError(400, 'INVALID_ID', 'Invalid Sitter ID');
    }

    const reviews = await sitterService.getSitterReviewsById(sitterId);
    res.status(200).json({ status: 'success', data: reviews });

  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: 'error', message: error.message });
      return;
    }
    console.error('Error getting sitter reviews:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};