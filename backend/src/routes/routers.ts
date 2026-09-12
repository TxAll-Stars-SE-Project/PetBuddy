import { Router } from 'express'
import { healthCheck } from '../controllers/health.controller.js'
import userRoutes from './user.routes.js'
import authRoutes from './auth.routes.js'
import petRoutes from './pet.routes.js'

const router = Router()

router.get('/health', healthCheck)
router.use('/users', userRoutes)
router.use('/auth', authRoutes)
router.use('/pets', petRoutes)

export default router
