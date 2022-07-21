import { json, urlencoded } from 'body-parser'
import compression from 'compression'
import express from 'express'
import cors from 'cors'
import routes from './routes'
import * as swaggerUi from 'swagger-ui-express'
import * as yaml from 'yamljs'
import * as path from 'path'
const openapiDocument = yaml.load(path.join(__dirname, `/openapi.yaml`))

const app = express()

app.use(compression())
app.use(cors())
app.use(json())
app.use(urlencoded({ extended: true }))
app.use('/v1/monitoring', routes)
app.use(
  '/v1/monitoring/docs/swagger-ui',
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument)
)

export default app
