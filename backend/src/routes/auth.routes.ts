import { Router } from 'express'
import { login, register, logout } from '../controllers/auth/auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

// POST /api/auth/login
router.post('/login', login)

// POST /api/auth/register
router.post('/register', register)

// POST /api/auth/logout
router.post('/logout', requireAuth, logout)

export default router
