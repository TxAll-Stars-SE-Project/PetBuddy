import { Router } from 'express'
import { deletePet } from '../controllers/pet.controller.js'
import { requireAuth, authorize } from '../middleware/auth.middleware.js'
import { uploadPetImageMiddleware } from '../middleware/upload.middleware.js'
import { createPetHandler, updatePetHandler } from '../controllers/pet/pet.controller.js'

const router = Router()

// Support both POST /api/pets/add and POST /api/pets
router.post(
  '/add',
  requireAuth,
  authorize('owner'),
  uploadPetImageMiddleware,
  createPetHandler
)

router.post(
  '/',
  requireAuth,
  authorize('owner'),
  uploadPetImageMiddleware,
  createPetHandler
)

// Edit pet: support both PATCH /api/pets/:id and PUT /api/pets/:id
router.patch(
  '/:id',
  requireAuth,
  authorize('owner'),
  uploadPetImageMiddleware,
  updatePetHandler
)

router.put(
  '/:id',
  requireAuth,
  authorize('owner'),
  uploadPetImageMiddleware,
  updatePetHandler
)

// DELETE /api/pets/:id
router.delete('/:id', requireAuth, authorize('owner'), deletePet)

export default router
