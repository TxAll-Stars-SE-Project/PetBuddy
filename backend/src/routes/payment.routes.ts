import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getPaymentSummary } from '../controllers/payment.controller.js'

const router = Router()

/**
 * ไม่ใส่ requireRole เพราะ API.md § 3.1 เปิดให้ทั้งเจ้าของสัตว์เลี้ยงและพี่เลี้ยงเรียกได้
 * การตรวจสอบว่าเป็นคู่สัญญาของการจองนั้นจริงหรือไม่ ทำที่ชั้น service (403)
 */
router.get('/:bookingId/payments', requireAuth, getPaymentSummary)

export default router
