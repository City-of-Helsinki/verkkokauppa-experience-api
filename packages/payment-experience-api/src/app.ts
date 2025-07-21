import { json, urlencoded } from 'body-parser'
import compression from 'compression'
import express from 'express'
import cors from 'cors'
import routes from './routes'
import * as swaggerUi from 'swagger-ui-express'
import * as yaml from 'yamljs'
import * as path from 'path'
// Importing the fs and https modules -------------- STEP 1
import https from 'https'
import fs from 'fs'
import { initSentry } from '@verkkokauppa/core'

const openapiDocument = yaml.load(path.join(__dirname, `/openapi.yaml`))

const app = express()

initSentry(app)
app.use(compression())
app.use(cors())
app.use(json())
app.use(urlencoded({ extended: true }))
app.use('/v1/payment', routes)
app.use(
  '/v1/payment/docs/swagger-ui',
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument)
)

// Middleware to serve static files from /public route
app.use('/v1/payment/public', express.static(path.join(__dirname, 'public')))

// Read the certificate and the private key for the https server options
// ------------------- STEP 2
// Create the https server by initializing it with 'options'
// -------------------- STEP 3
// NODE_ENV=development
if (
  process?.env?.NODE_ENV === 'development' && // yarn dev sets this.
  process?.env?.USE_HTTPS_SERVER === 'true'
) {
  https
    .createServer(
      {
        key: fs.readFileSync(path.join(__dirname, `/config/cert.key`)),
        cert: fs.readFileSync(path.join(__dirname, `/config/cert.crt`)),
      },
      app
    )
    .listen(8081, () => {
      console.log(`HTTPS server started on port 8081`)
    })
}

export default app
