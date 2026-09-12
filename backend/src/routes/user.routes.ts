import { Router } from 'express'
import { getAllUsers } from '../controllers/Users/user.controller.js'
import { getMyProfile, updateMyProfile } from '../controllers/profile.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

// GET /api/users/me
router.get('/me', requireAuth, getMyProfile)

// PUT /api/users/me — แก้ข้อมูลโปรไฟล์ตัวเอง (US2-2)
router.put('/me', requireAuth, updateMyProfile)

// TODO(US2-1): DELETE /api/auth/account — ปิด/ลบบัญชีตัวเอง
// ยังทำไม่ได้ รอคอลัมน์ USER.is_active (ยังไม่มีใน schema และยังไม่มี branch ไหนเพิ่ม)
// ต้องเคาะกับทีมก่อนว่าเป็น soft delete หรือลบจริง เพราะ FK ของ petowner/petsitter
// ตั้ง onDelete: Cascade ไว้ ลบ USER 1 แถว booking/pet/review/payment จะหายตามทั้งหมด

// GET /api/users
router.get('/', getAllUsers)

export default router
