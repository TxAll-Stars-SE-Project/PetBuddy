import { Router } from 'express'
import * as sittersController from '../controllers/sitters.controller.js'

const router = Router()

router.get('/:sitterID/services', sittersController.getPublicServices)

export default router