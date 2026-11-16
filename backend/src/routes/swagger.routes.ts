import { Router, Request, Response } from 'express'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import YAML from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

// Search candidate locations for docs/openapi.yaml
const candidatePaths = [
  path.resolve(__dirname, '../../../docs/openapi.yaml'),
  path.resolve(process.cwd(), '../docs/openapi.yaml'),
  path.resolve(process.cwd(), 'docs/openapi.yaml'),
]

const resolvedPath = candidatePaths.find((p) => fs.existsSync(p))
let openApiSpec: Record<string, unknown> = {}

if (resolvedPath) {
  try {
    const fileContent = fs.readFileSync(resolvedPath, 'utf8')
    openApiSpec = YAML.parse(fileContent)
  } catch (err) {
    console.error('[Swagger] Failed to parse openapi.yaml:', err)
  }
} else {
  console.warn('[Swagger] Warning: docs/openapi.yaml could not be found in candidate paths.')
}

// Function to reload spec dynamically (useful in local dev when editing openapi.yaml)
const getSpec = (): Record<string, unknown> => {
  if (resolvedPath && fs.existsSync(resolvedPath)) {
    try {
      const fileContent = fs.readFileSync(resolvedPath, 'utf8')
      openApiSpec = YAML.parse(fileContent)
    } catch {
      // Return cached version if read/parse fails
    }
  }
  return openApiSpec
}

// Endpoint to fetch raw OpenAPI spec as JSON
router.get('/openapi.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json')
  res.json(getSpec())
})

// Endpoint to fetch raw OpenAPI spec as YAML
router.get('/openapi.yaml', (_req: Request, res: Response) => {
  if (resolvedPath && fs.existsSync(resolvedPath)) {
    res.setHeader('Content-Type', 'text/yaml; charset=utf-8')
    res.send(fs.readFileSync(resolvedPath, 'utf8'))
  } else {
    res.status(404).json({ error: 'Spec file not found' })
  }
})

// Mount Swagger UI
router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'PetBuddy API Documentation',
    customCss: `
      .swagger-ui .topbar { background-color: #F97316; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      .swagger-ui .info { margin: 24px 0; }
      .swagger-ui .info .title { color: #EA580C; font-family: 'Prompt', sans-serif; }
    `,
    swaggerOptions: {
      url: '/api-docs/openapi.json',
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
    },
  })
)

export default router
