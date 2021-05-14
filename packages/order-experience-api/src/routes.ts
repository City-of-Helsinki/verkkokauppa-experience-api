import { Router } from 'express'

import { CreateController } from './api/createController'
import { CartToOrder } from './api/cartToOrder'
import { CancelController } from './api/cancelController'
import { AddItemController } from './api/addItemController'
const createController = new CreateController()
const cartToOrderController = new CartToOrder()
const cancelController = new CancelController()
const addItemController = new AddItemController()

const router = Router()
router.post('/', (req, res) => createController.execute(req, res))
router.post('/:orderId/cancel', (req, res) =>
  cancelController.execute(req, res)
)
router.post('/convert/:cartId', (req, res) =>
  cartToOrderController.execute(req, res)
)
router.post('/:orderId/setItems', (req, res) => addItemController.execute(req, res))

export default router
