import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import * as sitterController from '../controllers/sitter/sitter.controller.js'

const router = Router()

router.get('/me', requireAuth, sitterController.getMyServices)
router.post('/', requireAuth, sitterController.createService)

export default router