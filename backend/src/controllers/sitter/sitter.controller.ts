import { Response } from 'express'
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js'
import { AppError } from '../../utils/errors.js'
import * as sitterService from '../../services/sitter.service.js'
import { validateCreateServiceInput } from '../../validators/service.validator.js'

export const getMyServices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // role check ชั่วคราว — PR #4 จะ extract เป็น requireRole middleware
    if (req.auth!.role !== 'sitter') {
      throw new AppError(403, 'ROLE_NOT_ALLOWED', 'Sitter role required')
    }

    const services = await sitterService.getServicesBySitter(req.auth!.userId)
    res.status(200).json({ status: 'success', data: services })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.errorCode, message: error.message })
      return
    }
    console.error('Error getting my services:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}

export const createService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.auth!.role !== 'sitter') {
      throw new AppError(403, 'ROLE_NOT_ALLOWED', 'Sitter role required')
    }

    const input = validateCreateServiceInput(req.body)
    const service = await sitterService.createService(req.auth!.userId, input)

    res.status(201).json({ status: 'success', data: service })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        error: error.errorCode,
        message: error.message,
        ...(error.errors ? { errors: error.errors } : {}),
      })
      return
    }
    console.error('Error creating service:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}