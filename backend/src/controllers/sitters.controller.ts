import { Request, Response } from 'express'
import { AppError } from '../utils/errors.js'
import * as sitterService from '../services/sitter.service.js'
import { validateSitterSearchQuery } from '../validators/sitterSearch.validator.js'

export const searchSitters = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = validateSitterSearchQuery(req.query)
    const { items, pagination } = await sitterService.listSitters(filters)
    res.status(200).json({ status: 'success', data: items, pagination })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        error: error.errorCode,
        message: error.message,
        ...(error.errors && { errors: error.errors }),
      })
      return
    }
    console.error('Error searching sitters:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}

export const getPublicServices =async (req: Request, res: Response): Promise<void> => {
  try {
    const sitterId = Number(req.params.sitterID)
    if (!Number.isInteger(sitterId) || sitterId <= 0) {
      throw new AppError(400, 'SITTER_NOT_FOUND', 'Sitter not found')
    }

    const services = await sitterService.getPublishedServicesBySitter(sitterId)
    res.status(200).json({ status: 'success', data: services })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: 'error', error: error.errorCode, message: error.message })
      return
    }
    console.error('Error getting public services:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}

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

export const getSitterBusySlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const sitterId = Number(req.params.sitterID);
    if (!Number.isInteger(sitterId) || sitterId <= 0) {
      throw new AppError(400, 'SITTER_NOT_FOUND', 'Sitter not found');
    }

    const date = req.query.date as string;
    
    // Validate ในรูปแบบ YYYY-MM-DD
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError(400, 'INVALID_DATE', 'Invalid or missing date parameter');
    }

    const data = await sitterService.getBusySlots(sitterId, date);
    
    res.status(200).json({ status: 'success', data });

  } catch (error) {
    if (error instanceof AppError) {
      if (error.errorCode === 'INVALID_DATE') {
        res.status(400).json({ status: 'error', message: error.message });
        return;
      }
      res.status(error.statusCode).json({ status: 'error', message: error.message });
      return;
    }
    console.error('Error getting busy slots:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};