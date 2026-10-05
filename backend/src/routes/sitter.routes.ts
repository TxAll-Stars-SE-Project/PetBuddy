import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import * as sitterController from '../controllers/sitter/sitter.controller.js'
import { requireRole } from '../middleware/role.middleware.js'

const router = Router()

router.get('/me', requireAuth, requireRole('sitter'), sitterController.getMyServices)
router.post('/', requireAuth, requireRole('sitter'), sitterController.createService)

export default router