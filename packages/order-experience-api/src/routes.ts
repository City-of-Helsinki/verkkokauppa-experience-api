import { Router } from 'express'

import { CreateController } from './api/createController'
import { CartToOrder } from './api/cartToOrder'
import { CancelController } from './api/cancelController'
import { SetCustomerController } from './api/setCustomerController'
import { AddItemController } from './api/addItemController'
import { GetController } from './api/getController'
import { getSubscriptionController } from './api/getSubscription'
import { searchActiveSubscriptionsController } from './api/searchActiveSubscriptions'
import { createSubscriptionController } from './api/createSubscription'
import { createSubscriptionsFromOrderController } from './api/createSubscriptionsFromOrder'
import { CalculateTotalsController } from './api/calculateTotals'
import { InstantPurchase } from './api/instantPurchase'
import { ConfirmAndCreatePayment } from './api/confirmAndCreatePayment'
import { Health } from './api/health'
import { GetAdminController } from './api/getAdminController'
import { GetSubscriptionOrdersController } from './api/getSubscriptionOrdersController'
import { CancelSubscription } from './api/cancelSubscription'
import { SendSubscriptionContractEmail } from './api/sendSubscriptionContractEmail'

const createController = new CreateController()
const cartToOrderController = new CartToOrder()
const cancelController = new CancelController()
const confirmAndCreatePaymentController = new ConfirmAndCreatePayment()
const setCustomerController = new SetCustomerController()
const addItemController = new AddItemController()
const getController = new GetController()
const getAdminController = new GetAdminController()
const getSubscriptionCtrl = new getSubscriptionController()
const getSubscriptionOrdersCtrl = new GetSubscriptionOrdersController()
const searchActiveSubscriptionsCtrl = new searchActiveSubscriptionsController()
const createSubscriptionCtrl = new createSubscriptionController()
const createSubscriptionsFromOrderCtrl = new createSubscriptionsFromOrderController()
const calculateTotalsController = new CalculateTotalsController()
const instantPurchaseController = new InstantPurchase()
const healthController = new Health()
const cancelSubscription = new CancelSubscription()
const sendSubscriptionContractEmail = new SendSubscriptionContractEmail()

const router = Router()
router.post('/', (req, res) => createController.execute(req, res))
router.get('/health', (req, res) => healthController.execute(req, res))
router.get('/:orderId', (req, res) => getController.execute(req, res))
router.get('/admin/:orderId', (req, res) =>
  getAdminController.execute(req, res)
)
router.get('/subscription/:id', (req, res) =>
  getSubscriptionCtrl.execute(req, res)
)
router.get('/subscription/:id/orders', (req, res) =>
  getSubscriptionOrdersCtrl.execute(req, res)
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
router.post('/:orderId/confirmAndCreatePayment', (req, res) =>
  confirmAndCreatePaymentController.execute(req, res)
)
router.post('/:orderId/calculateTotals', (req, res) =>
  calculateTotalsController.execute(req, res)
)
router.post('/convert/:cartId', (req, res) =>
  cartToOrderController.execute(req, res)
)
router.post('/subscription/create', (req, res) =>
  createSubscriptionCtrl.execute(req, res)
)
router.post('/subscription/create-from-order', (req, res) =>
  createSubscriptionsFromOrderCtrl.execute(req, res)
)
router.post('/subscription/search/active', (req, res) =>
  searchActiveSubscriptionsCtrl.execute(req, res)
)
router.post('/subscription/:id/cancel', (req, res) =>
  cancelSubscription.execute(req, res)
)
router.post('/subscription/:id/emailSubscriptionContract', (req, res) =>
  sendSubscriptionContractEmail.execute(req, res)
)

router.post('/instantPurchase', (req, res) =>
  instantPurchaseController.execute(req, res)
)

export default router
