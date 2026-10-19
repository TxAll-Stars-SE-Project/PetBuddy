import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { getOwnerBookings } from '../controllers/owner/owner-booking.controller.js'

const router = Router()

/**
 * ทุก route ในเส้นทางนี้ต้องผ่านการตรวจสอบ:
 * 1. requireAuth: ต้องมี Bearer token ที่ถูกต้อง
 * 2. requireRole('owner'): ผู้ใช้ต้องมีบทบาทเป็นเจ้าของสัตว์เลี้ยงเท่านั้น
 */
router.get('/', requireAuth, requireRole('owner'), getOwnerBookings)

export default router
