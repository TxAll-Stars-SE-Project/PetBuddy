import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { uploadQrCodeMiddleware } from '../middleware/upload.middleware.js'
import * as sitterPaymentController from '../controllers/sitter/sitter-payment.controller.js'

const router = Router()

router.get(
  '/',
  requireAuth,
  requireRole('sitter'),
  sitterPaymentController.getPaymentInfo
)

router.post(
  '/',
  requireAuth,
  requireRole('sitter'),
  uploadQrCodeMiddleware,
  sitterPaymentController.createPaymentInfo
)

router.patch(
  '/',
  requireAuth,
  requireRole('sitter'),
  uploadQrCodeMiddleware,
  sitterPaymentController.updatePaymentInfo
)

router.delete(
  '/',
  requireAuth,
  requireRole('sitter'),
  sitterPaymentController.deletePaymentInfo
)

export default router
