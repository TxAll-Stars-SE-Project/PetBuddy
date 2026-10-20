import { Router } from 'express'
import userRoutes from './user.routes.js'
import authRoutes from './auth.routes.js'
import petRoutes from './pet.routes.js'
import bookingRoutes from './booking.routes.js';

const router = Router()

router.use('/users', userRoutes)
router.use('/auth', authRoutes)
router.use('/pets', petRoutes)
router.use('/bookings', bookingRoutes);

export default router