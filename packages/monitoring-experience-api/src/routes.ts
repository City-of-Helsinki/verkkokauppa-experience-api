import { Router } from 'express'
import { ElasticSearchHealthController } from './api/elasticSearchHealthController'
import { Health } from './api/health'

const router = Router()

const elasticSearchHealthController = new ElasticSearchHealthController()
const healthController = new Health()

router.get('/health', (req, res) => healthController.execute(req, res))
router.get('/health/elasticsearch', (req, res) =>
  elasticSearchHealthController.execute(req, res)
)

export default router
