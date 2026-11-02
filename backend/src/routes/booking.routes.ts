import { Router } from 'express';
import { requireAuth, authorize } from '../middleware/auth.middleware.js';
import { cancelBooking, createBooking } from '../controllers/booking.controller.js';

const router = Router();

// POST /api/bookings
router.post('/', requireAuth, authorize('owner'), createBooking);

// PATCH /api/bookings/:bookingId  (owner cancels own booking)
router.patch('/:bookingId', requireAuth, authorize('owner'), cancelBooking);

export default router;
