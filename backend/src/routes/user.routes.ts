import { Router } from 'express'
import { getAllUsers } from '../controllers/Users/user.controller.js'
import { getMyProfile } from '../controllers/profile.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

// GET /api/users/me
router.get('/me', requireAuth, getMyProfile)

// GET /api/users
router.get('/', getAllUsers)

export default router
