import { Router } from 'express'
import { login, register, logout, forgotPassword, resetPassword } from '../controllers/auth/auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

// POST /api/auth/login
router.post('/login', login)

// POST /api/auth/register
router.post('/register', register)

// POST /api/auth/logout
router.post('/logout', requireAuth, logout)

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword)

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword)

export default router
