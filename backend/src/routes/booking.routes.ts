import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import {
  getPaymentSummaryController,
  verifyPaymentSlipController,
} from '../controllers/payment/payment.controller.js'

const router = Router()

/**
 * GET /api/bookings/:bookingID/payments
 * ดึงข้อมูลสรุปยอดชำระเงินและประวัติสลิปทั้งหมดของการจอง
 */
router.get('/:bookingID/payments', requireAuth, getPaymentSummaryController)

/**
 * PATCH /api/bookings/:bookingID/verify-payment
 * พี่เลี้ยงตรวจสอบและยืนยันหรือปฏิเสธสลิปการโอนเงิน
 */
router.patch(
  '/:bookingID/verify-payment',
  requireAuth,
  requireRole('sitter'),
  verifyPaymentSlipController
)

export default router
