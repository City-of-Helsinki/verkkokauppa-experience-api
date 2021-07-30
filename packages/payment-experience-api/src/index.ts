import app from './app'
import { logger } from '@verkkokauppa/core'

const PORT = process.env.PORT || 8080
const serve = () =>
  app.listen(PORT, () => {
    logger.debug(`Server is running at https://localhost:${PORT}`)
  })

serve()
