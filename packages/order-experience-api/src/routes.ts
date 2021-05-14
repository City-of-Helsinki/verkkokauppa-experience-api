import { Router } from 'express'

import { CreateController } from './api/createController'
import { CartToOrder } from './api/cartToOrder'
const createController = new CreateController()
const cartToOrderController = new CartToOrder()

const router = Router()
router.post('/', (req, res) => createController.execute(req, res))
router.post('/convert/:cartId', (req, res) =>
  cartToOrderController.execute(req, res)
)

export default router
