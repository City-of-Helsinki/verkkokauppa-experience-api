import { Router } from 'express'

import { GetController } from './api/getController'
import { CreateController } from './api/createController'
import { GetMappingController } from './api/getMappingController'
import { CreateProductAccountingController } from './api/createProductAccountingController'
import { Health } from './api/health'
import { GetProductAccountingController } from './api/getProductAccountingController'
import { GetProductAccountingByNamespaceController } from './api/getProductAccountingByNamespaceController'
import { GetProductAccountingByNamespaceAdminController } from './api/getProductAccountingByNamespaceAdminController'

const getController = new GetController()
const createController = new CreateController()
const getMappingController = new GetMappingController()
const createProductAccountingController = new CreateProductAccountingController()
const getProductAccountingController = new GetProductAccountingController()
const getProductAccountingByNamespaceController = new GetProductAccountingByNamespaceController()
const getProductAccountingByNamespaceAdminController = new GetProductAccountingByNamespaceAdminController()
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

router.get('/namespace/accountings', (req, res) =>
  getProductAccountingByNamespaceController.execute(req, res)
)
router.get('/admin/:namespace/accountings', (req, res) =>
  getProductAccountingByNamespaceAdminController.execute(req, res)
)

export default router
