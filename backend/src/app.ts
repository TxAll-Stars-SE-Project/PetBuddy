import express, { Express } from 'express'
import sitterRoutes from './routes/sitter.routes.js'
import sittersRoutes from './routes/sitters.routes.js'
import cors from 'cors'
import routes from './routes/routers.js'

const app: Express = express()

app.use(cors())
app.use(express.json())

app.use('/api', routes)

app.use('/api/sitter/services', sitterRoutes)
app.use('/api/sitters', sittersRoutes) 

export default app
