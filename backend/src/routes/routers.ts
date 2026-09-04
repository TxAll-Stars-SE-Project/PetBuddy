import { Router } from 'express'
import { healthCheck } from '../controllers/health.controller.js'
import userRoutes from './user.routes.js'

const router = Router()

router.get('/health', healthCheck)
router.use('/users', userRoutes)

export default router
