import { Router } from 'express';
import { getSitterProfile, getSitterReviews } from '../controllers/sitter/sitter.controller.js';

const router = Router();

router.get('/:sitterID', getSitterProfile);
router.get('/:sitterID/reviews', getSitterReviews);

export default router;