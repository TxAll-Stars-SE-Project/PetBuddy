import express, { Express } from 'express'
import sitterRoutes from './routes/sitter.routes.js'
import sitterBookingRoutes from './routes/sitter-booking.routes.js'
import sittersRoutes from './routes/sitters.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import bookingRoutes from './routes/booking.routes.js'
import cors from 'cors'
import routes from './routes/routers.js'

const app: Express = express()

app.use(cors())
app.use(express.json())

app.use('/api', routes)

app.use('/api/sitter/services', sitterRoutes)
app.use('/api/sitter/bookings', sitterBookingRoutes)
app.use('/api/sitters', sittersRoutes) 
app.use('/api/payments', paymentRoutes)
app.use('/api/bookings', bookingRoutes)

export default app

