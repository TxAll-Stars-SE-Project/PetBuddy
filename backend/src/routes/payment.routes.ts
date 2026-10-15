import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { uploadSlipMiddleware } from '../middleware/upload.middleware.js'
import { submitPaymentSlipController } from '../controllers/payment/payment.controller.js'

const router = Router()

/**
 * POST /api/payments
 * Pet owner uploads bank transfer slip as proof of payment
 */
router.post(
  '/',
  requireAuth,
  requireRole('owner'),
  uploadSlipMiddleware,
  submitPaymentSlipController
)

export default router
