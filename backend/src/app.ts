import express, { Express } from 'express'
import sitterRoutes from './routes/sitter.routes.js'
import sitterBookingRoutes from './routes/sitter-booking.routes.js'
import sittersRoutes from './routes/sitters.routes.js'
import ownerBookingRoutes from './routes/owner-booking.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import cors from 'cors'
import routes from './routes/routers.js'

const app: Express = express()

app.use(cors())
app.use(express.json())

app.use('/api', routes)

app.use('/api/sitter/services', sitterRoutes)
app.use('/api/sitter/bookings', sitterBookingRoutes)
app.use('/api/sitters', sittersRoutes)
app.use('/api/owner/bookings', ownerBookingRoutes)
// §3.1 สรุปยอดชำระ — แยกไฟล์จาก booking.routes.ts ของ US5-1 (POST /api/bookings)
// ทั้งสองอยู่ใต้ /api/bookings ได้พร้อมกันเพราะคนละ method/path ย่อย
app.use('/api/bookings', paymentRoutes)

export default app

