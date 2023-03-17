import { json, urlencoded } from 'body-parser'
import compression from 'compression'
import express from 'express'
import cors from 'cors'
import routes from './routes'
import * as swaggerUi from 'swagger-ui-express'
import * as yaml from 'yamljs'
import * as path from 'path'
const openapiDocument = yaml.load(path.join(__dirname, `/openapi.yaml`))

// Importing the fs and https modules -------------- STEP 1
import https from 'https'
import fs from 'fs'

// Read the certificate and the private key for the https server options
// ------------------- STEP 2
const options = {
  key: fs.readFileSync(path.join(__dirname, `/config/cert.key`)),
  cert: fs.readFileSync(path.join(__dirname, `/config/cert.crt`)),
}
const app = express()

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

// Create the https server by initializing it with 'options'
// -------------------- STEP 3
https.createServer(options, app).listen(8081, () => {
  console.log(`HTTPS server started on port 8081`)
})

export default app
