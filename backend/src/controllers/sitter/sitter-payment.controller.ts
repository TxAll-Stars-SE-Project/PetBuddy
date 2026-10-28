import { Response } from 'express'
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js'
import { AppError } from '../../utils/errors.js'
import {
  validateCreatePaymentInfoInput,
  validateUpdatePaymentInfoInput,
} from '../../validators/sitter-payment.validator.js'
import * as sitterPaymentService from '../../services/sitter-payment.service.js'

export const getPaymentInfo = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const sitterId = req.auth!.userId
    const data = await sitterPaymentService.getPaymentInfo(sitterId)
    res.status(200).json({ success: true, data })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
      return
    }
    console.error('Error fetching sitter payment info:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const handleSavePaymentInfo = async (
  req: AuthenticatedRequest,
  res: Response,
  mode: 'create' | 'update'
): Promise<void> => {
  try {
    const sitterId = req.auth!.userId
    const input =
      mode === 'create'
        ? validateCreatePaymentInfoInput(req.body, req.file)
        : validateUpdatePaymentInfoInput(req.body, req.file)

    const saved = await sitterPaymentService.savePaymentInfo(sitterId, input)

    res.status(mode === 'create' ? 201 : 200).json({
      success: true,
      message: 'บันทึกข้อมูลการรับเงินสำเร็จ',
      data: saved,
    })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
      return
    }
    console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} sitter payment info:`, error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const createPaymentInfo = (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => handleSavePaymentInfo(req, res, 'create')

export const updatePaymentInfo = (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => handleSavePaymentInfo(req, res, 'update')

export const deletePaymentInfo = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const sitterId = req.auth!.userId
    const data = await sitterPaymentService.deletePaymentInfo(sitterId)

    res.status(200).json({
      success: true,
      message: 'ลบข้อมูลการรับเงินสำเร็จ',
      data,
    })
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
      return
    }
    console.error('Error deleting sitter payment info:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
