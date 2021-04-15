import app from './app'
import logger from './logger'

const PORT = process.env.PORT || 8080
const serve = () =>
  app.listen(PORT, () => {
    logger.debug(`Server is running at https://localhost:${PORT}`)
  })

serve()
