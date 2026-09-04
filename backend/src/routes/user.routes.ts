import { Router } from 'express'
import { getAllUsers } from '../controllers/Users/user.controller.js'

const router = Router()

// GET /api/users
router.get('/', getAllUsers)

export default router
