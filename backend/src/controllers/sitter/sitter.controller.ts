import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js'
import { AppError } from '../../utils/errors.js';
import * as sitterService from '../../services/sitter.service.js'; 
import { validateCreateServiceInput, validateUpdateServiceInput } from '../../validators/service.validator.js'

export const getMyServices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
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

// ✅ PATCH handler
export const updateService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const serviceId = Number(req.params.serviceID)
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      throw new AppError(404, 'SERVICE_NOT_FOUND', 'Service not found')
    }

    const input = validateUpdateServiceInput(req.body)
    const service = await sitterService.updateService(serviceId, req.auth!.userId, input)

    res.status(200).json({ status: 'success', data: service })
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
    console.error('Error updating service:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}

// ✅ DELETE handler
export const deleteService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const serviceId = Number(req.params.serviceID)
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      throw new AppError(404, 'SERVICE_NOT_FOUND', 'Service not found')
    }

    const result = await sitterService.deleteService(serviceId, req.auth!.userId)

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
    console.error('Error deleting service:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}
