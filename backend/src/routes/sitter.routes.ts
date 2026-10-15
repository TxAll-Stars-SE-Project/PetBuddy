import { Router } from 'express';
import { getSitterProfile, getSitterReviews, getSitterBusySlots } from '../controllers/sitter/sitter.controller.js';

const router = Router();

router.get('/:sitterID', getSitterProfile);
router.get('/:sitterID/reviews', getSitterReviews);
router.get('/:sitterID/busy-slots', getSitterBusySlots);

export default router;