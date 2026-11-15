import { Router } from 'express'
import { getMyProfile, updateMyProfile } from '../controllers/profile.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

// GET /api/users/me
router.get('/me', requireAuth, getMyProfile)

// PUT /api/users/me — แก้ข้อมูลโปรไฟล์ตัวเอง (US2-2)
router.put('/me', requireAuth, updateMyProfile)

export default router
