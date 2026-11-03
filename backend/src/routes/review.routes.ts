import { Router } from 'express'
import { requireAuth, authorize } from '../middleware/auth.middleware.js'
import { createReview } from '../controllers/review.controller.js'

const router = Router()

router.post('/', requireAuth, authorize('owner'), createReview)

export default router
