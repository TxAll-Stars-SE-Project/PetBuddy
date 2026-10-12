import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import {
  getSitterBookings,
  updateBookingStatus,
} from '../controllers/sitter/sitter-booking.controller.js'

const router = Router()

/**
 * ทุก route ในเส้นทางนี้ต้องผ่านการตรวจสอบ:
 * 1. requireAuth: ต้องมี Bearer token ที่ถูกต้อง
 * 2. requireRole('sitter'): ผู้ใช้ต้องมีบทบาทเป็นพี่เลี้ยงสัตว์เลี้ยงเท่านั้น
 */
router.get('/', requireAuth, requireRole('sitter'), getSitterBookings)
router.patch('/:id', requireAuth, requireRole('sitter'), updateBookingStatus)

export default router
