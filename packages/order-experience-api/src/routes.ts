import { Router } from 'express'

import { CreateController } from './api/createController'
import { CartToOrder } from './api/cartToOrder'
import { CancelController } from './api/cancelController'
import { SetCustomerController } from './api/setCustomerController'
import { AddItemController } from './api/addItemController'
import { GetController } from './api/getController'

const createController = new CreateController()
const cartToOrderController = new CartToOrder()
const cancelController = new CancelController()
const setCustomerController = new SetCustomerController()
const addItemController = new AddItemController()
const getController = new GetController()

const router = Router()
router.post('/', (req, res) => createController.execute(req, res))
router.get('/:orderId', (req, res) => getController.execute(req, res))
router.post('/:orderId/customer', (req, res) =>
  setCustomerController.execute(req, res)
)
router.post('/:orderId/items', (req, res) =>
  addItemController.execute(req, res)
)
router.post('/:orderId/cancel', (req, res) =>
  cancelController.execute(req, res)
)
router.post('/convert/:cartId', (req, res) =>
  cartToOrderController.execute(req, res)
)

export default router
