import { Router } from 'express'
import { getAllUsers } from '../controllers/Users/user.controller.js'
import { getMyProfile, updateMyProfile } from '../controllers/profile.controller.js'
import { deactivateAccount } from '../controllers/auth/auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

// GET /api/users/me
router.get('/me', requireAuth, getMyProfile)

// PUT /api/users/me — แก้ข้อมูลโปรไฟล์ตัวเอง (US2-2)
router.put('/me', requireAuth, updateMyProfile)

// PATCH /api/users/me/deactivate — ปิดใช้งานบัญชีตัวเอง (US2-1)
router.patch('/me/deactivate', requireAuth, deactivateAccount)

// GET /api/users
router.get('/', getAllUsers)

export default router
