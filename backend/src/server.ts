import dotenv from 'dotenv'
import app from './app.js'
import prisma from './utils/prisma.js'
import sitterRoutes from './routes/sitter.routes.js'
import sittersRoutes from './routes/sitters.routes.js'

dotenv.config()

const PORT = process.env.PORT || 5000

app.use('/api/sitter/services', sitterRoutes)
app.use('/api/sitters', sittersRoutes)

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`)
  // วอร์มการเชื่อมต่อฐานข้อมูลล่วงหน้า (Supabase) ไม่ให้ Request แรกต้องรอนาน 5 วินาที
  prisma.$connect()
    .then(() => console.log('Database connection ready.'))
    .catch((err) => console.warn('Database warmup warning:', err.message))
})