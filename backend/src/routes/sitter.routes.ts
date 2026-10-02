import { Router } from 'express';
import { getSitterProfile, getSitterServices } from '../controllers/sitter/sitter.controller.js'; 

const router = Router();

router.get('/:sitterID', getSitterProfile);
router.get('/:sitterID/services', getSitterServices);

export default router;