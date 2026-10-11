import { Request, Response } from 'express'
import { AppError } from '../utils/errors.js'
import * as sitterService from '../services/sitter.service.js'
import { validateSitterSearchQuery } from '../validators/sitterSearch.validator.js'

export const searchSitters = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = validateSitterSearchQuery(req.query)
    const data = await sitterService.listSitters(filters)
    res.status(200).json({ status: 'success', data })
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
      throw new AppError(404, 'SITTER_NOT_FOUND', 'Sitter not found')
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