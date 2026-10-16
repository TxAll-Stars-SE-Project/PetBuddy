import { Router } from 'express'
import * as sittersController from '../controllers/sitters.controller.js'

const router = Router()

router.get('/', sittersController.searchSitters)
router.get('/:sitterID', sittersController.getSitterProfile)
router.get('/:sitterID/services', sittersController.getPublicServices)
router.get('/:sitterID/reviews', sittersController.getSitterReviews)
router.get('/:sitterID/busy-slots', sittersController.getSitterBusySlots)

export default router