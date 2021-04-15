import bodyParser from 'body-parser'
import compression from 'compression'
import express from 'express'
import routes from './routes'

const app = express()

app.use(compression())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(routes)

export default app
