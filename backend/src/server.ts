// backend/src/server.ts
import dotenv from 'dotenv'
import app from './app.js'
import prisma from './utils/prisma.js'

dotenv.config()
const PORT = process.env.PORT || 5000

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`)
  prisma.$connect()
    .then(() => console.log('Database connection ready.'))
    .catch((err) => console.warn('Database warmup warning:', err.message))
})