import express, { Express } from 'express'
import cors from 'cors'
import routes from './routes/routers.js'

const app: Express = express()

app.use(cors())
app.use(express.json())

app.use('/api', routes)

export default app
