import { Router } from 'express'
import userRoutes from './user.routes.js'
import authRoutes from './auth.routes.js'
import petRoutes from './pet.routes.js'
import sittersRoutes from './sitters.routes.js'
import sitterRoutes from './sitter.routes.js'
import sitterBookingRoutes from './sitter-booking.routes.js'
import bookingRoutes from './booking.routes.js' // 👈 Import

const router = Router()

router.use('/users', userRoutes)
router.use('/auth', authRoutes)
router.use('/pets', petRoutes)
router.use('/sitters', sittersRoutes)
router.use('/sitter', sitterRoutes)
router.use('/sitter/bookings', sitterBookingRoutes)
router.use('/bookings', bookingRoutes) // 👈 Mount POST /api/bookings

export default router