import { Request, Response } from 'express'
import { validateRegisterInput } from '../../validators/auth.validator.js'
import * as authService from '../../services/auth.service.js'
import { AppError } from '../../utils/errors.js'

export const register = async (req: Request, res: Response)=> {
  try {
    // 1. ตรวจสอบความถูกต้องของ Input
    const validationErrors = validateRegisterInput(req.body)
    if (validationErrors.length > 0) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        errors: validationErrors,
      })
      return
    }

    const result = await authService.registerUser(req.body)

    // 3. ตอบกลับเมื่อสำเร็จ (201 Created)
    res.status(201).json({
      success: true,
      ...result,
    })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message,
        ...(error.errors ? { errors: error.errors } : {}),
      })
      return
    }

    console.error('Error during registration:', error)
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to register user',
      detail: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
