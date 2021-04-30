import { Router } from 'express'

import { CreateController } from './api/createController'
import { GetController } from './api/getController'
import { AddItemController } from './api/addItemController'
import { RemoveItemController } from './api/removeItemController'
import { TotalsController } from './api/totalsController'
const createController = new CreateController()
const getController = new GetController()
const addItemController = new AddItemController()
const removeItemController = new RemoveItemController()
const totalsController = new TotalsController()

const router = Router()
router.post('/', (req, res) => createController.execute(req, res))
router.get('/:cartId', (req, res) => getController.execute(req, res))
router.post('/:cartId/items', (req, res) => addItemController.execute(req, res))
router.delete('/:cartId/items/:productId', (req, res) =>
  removeItemController.execute(req, res)
)
router.get('/:cartId/totals', (req, res) => totalsController.execute(req, res))

export default router