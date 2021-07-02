import { Router } from 'express'

import { GetController } from './api/getController'
import { CreateController } from './api/createController'
import { GetMappingController } from './api/getMappingController'
import { CreateProductAccountingController } from './api/createProductAccountingController'

const getController = new GetController()
const createController = new CreateController()
const getMappingController = new GetMappingController()
const createProductAccountingController = new CreateProductAccountingController();

const router = Router()
router.get('/:productId', (req, res) => getController.execute(req, res))
router.get('/:productId/mapping', (req, res) =>
  getMappingController.execute(req, res)
)
router.post('/', (req, res) => createController.execute(req, res))

export default router
