import { Router } from 'express';
import { requireAuth, authorize } from '../middleware/auth.middleware.js';
import { createBooking } from '../controllers/booking.controller.js';

const router = Router();

// POST /api/bookings
router.post('/', requireAuth, authorize('owner'), createBooking);

export default router;
