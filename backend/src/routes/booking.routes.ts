import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { createBooking } from '../controllers/booking.controller.js'

const router = Router()

// POST /api/bookings
router.post('/', requireAuth, createBooking)

export default router