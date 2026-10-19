import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { getOwnerBookings } from '../controllers/owner/owner-booking.controller.js'

const router = Router()

/**
 * GET /api/owner/bookings
 * ตรวจสอบสิทธิ์:
 * 1. requireAuth: ต้องมี Bearer token
 * 2. requireRole('owner'): ผู้ใช้ต้องมีบทบาทเป็นเจ้าของสัตว์เลี้ยง
 */
router.get('/', requireAuth, requireRole('owner'), getOwnerBookings)

export default router
