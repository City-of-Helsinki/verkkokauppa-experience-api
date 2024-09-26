import { Router } from 'express'

import { GetController } from './api/getController'
import { CreateController } from './api/createController'
import { GetMappingController } from './api/getMappingController'
import { CreateProductAccountingController } from './api/createProductAccountingController'
import { Health } from './api/health'
import { GetProductAccountingController } from './api/getProductAccountingController'

const getController = new GetController()
const createController = new CreateController()
const getMappingController = new GetMappingController()
const createProductAccountingController = new CreateProductAccountingController()
const getProductAccountingController = new GetProductAccountingController()
const healthController = new Health()

const router = Router()
router.get('/health', (req, res) => healthController.execute(req, res))
router.get('/:productId', (req, res) => getController.execute(req, res))
router.get('/:productId/mapping', (req, res) =>
  getMappingController.execute(req, res)
)
router.post('/', (req, res) => createController.execute(req, res))
router.post('/:productId/accounting', (req, res) =>
  createProductAccountingController.execute(req, res)
)

router.get('/:productId/accounting', (req, res) =>
  getProductAccountingController.execute(req, res)
)

export default router
