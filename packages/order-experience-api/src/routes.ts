import { Router } from 'express'

import { CreateController } from './api/createController'
import { CartToOrder } from './api/cartToOrder'
import { CancelController } from './api/cancelController'
import { SetCustomerController } from './api/setCustomerController'
import { AddItemController } from './api/addItemController'
import { GetController } from './api/getController'
import { GetRecurringOrderController } from './api/getRecurringOrder'
import { SearchActiveRecurringOrderController } from './api/searchActiveRecurringOrder'
import { CreateRecurringOrderController } from './api/createRecurringOrder'
import { CreateRecurringOrdersFromOrderController } from './api/createRecurringOrdersFromOrder'
import { CalculateTotalsController } from './api/calculateTotals'

const createController = new CreateController()
const cartToOrderController = new CartToOrder()
const cancelController = new CancelController()
const setCustomerController = new SetCustomerController()
const addItemController = new AddItemController()
const getController = new GetController()
const getRecurringOrderCtrl = new GetRecurringOrderController()
const searchActiveRecurringOrderCtrl = new SearchActiveRecurringOrderController()
const createRecurringOrderCtrl = new CreateRecurringOrderController()
const createRecurringOrdersFromOrderCtrl = new CreateRecurringOrdersFromOrderController()
const calculateTotalsController = new CalculateTotalsController()

const router = Router()
router.post('/', (req, res) => createController.execute(req, res))
router.get('/:orderId', (req, res) => getController.execute(req, res))
router.get('/recurringorder/:id', (req, res) =>
  getRecurringOrderCtrl.execute(req, res)
)
router.post('/:orderId/customer', (req, res) =>
  setCustomerController.execute(req, res)
)
router.post('/:orderId/items', (req, res) =>
  addItemController.execute(req, res)
)
router.post('/:orderId/cancel', (req, res) =>
  cancelController.execute(req, res)
)
router.post('/:orderId/calculateTotals', (req, res) =>
  calculateTotalsController.execute(req, res)
)
router.post('/convert/:cartId', (req, res) =>
  cartToOrderController.execute(req, res)
)
router.post('/recurringorder/create', (req, res) =>
  createRecurringOrderCtrl.execute(req, res)
)
router.post('/recurringorder/create-from-order', (req, res) =>
  createRecurringOrdersFromOrderCtrl.execute(req, res)
)
router.post('/recurringorder/search/active', (req, res) =>
  searchActiveRecurringOrderCtrl.execute(req, res)
)

export default router
