import { Router } from 'express'
import { deletePet } from '../controllers/pet.controller.js'
import { requireAuth, authorize } from '../middleware/auth.middleware.js'

const router = Router()

// DELETE /api/pets/:id
router.delete('/:id', requireAuth, authorize('owner'), deletePet)

export default router
