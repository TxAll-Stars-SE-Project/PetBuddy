import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { uploadCareReportPhotoMiddleware } from '../middleware/upload.middleware.js'
import { createCareReport } from '../controllers/care-report.controller.js'

const router = Router()

/**
 * POST /api/bookings/:bookingId/reports (US7-3)
 * ตรวจ token และ role ก่อนรับไฟล์ เพื่อไม่ต้องอ่านไฟล์ของคำขอที่ไม่มีสิทธิ์
 */
router.post(
  '/:bookingId/reports',
  requireAuth,
  requireRole('sitter'),
  uploadCareReportPhotoMiddleware,
  createCareReport
)

export default router
