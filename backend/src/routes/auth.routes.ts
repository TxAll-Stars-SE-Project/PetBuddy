import { Router } from 'express'
import { login } from '../controllers/auth.controller.js'
import { register } from '../controllers/auth/auth.controller.js'

const router = Router()

// POST /api/auth/login
router.post('/login', login)

// POST /api/auth/register
router.post('/register', register)

export default router
