import express, { Express } from 'express'
import sitterRoutes from './routes/sitter.routes.js'
import sitterBookingRoutes from './routes/sitter-booking.routes.js'
import sitterPaymentRoutes from './routes/sitter-payment.routes.js'
import sittersRoutes from './routes/sitters.routes.js'
import ownerBookingRoutes from './routes/owner-booking.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import careReportRoutes from './routes/care-report.routes.js'
import reviewRoutes from './routes/review.routes.js'
import cors from 'cors'
import routes from './routes/routers.js'

const app: Express = express()

app.use(cors())
app.use(express.json())

app.use('/api', routes)

app.use('/api/sitter/services', sitterRoutes)
app.use('/api/sitter/bookings', sitterBookingRoutes)
app.use('/api/sitter/payment-info', sitterPaymentRoutes)
app.use('/api/sitters', sittersRoutes)
app.use('/api/owner/bookings', ownerBookingRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/reviews', reviewRoutes)
// US7-3 รายงานการดูแลสัตว์เลี้ยง: /api/bookings/:bookingId/reports
app.use('/api/bookings', careReportRoutes)

export default app
