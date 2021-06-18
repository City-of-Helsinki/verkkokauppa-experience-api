import { json, urlencoded } from 'body-parser'
import compression from 'compression'
import express from 'express'
import cors from 'cors'
import routes from './routes'

const app = express()

app.use(compression())
app.use(cors())
app.use(json())
app.use(urlencoded({ extended: true }))
app.use(routes)

export default app
