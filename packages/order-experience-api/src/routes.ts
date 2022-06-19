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
import { SendSubscriptionPaymentFailedEmail } from './api/sendSubscriptionPaymentFailedEmail'
import { SetSubscriptionItemMetaController } from './api/setSubscriptionItemMeta'
import { withAuthentication } from '@verkkokauppa/auth-helsinki-profile'
import { RecreateSubscriptionController } from './api/recreateSubscription'
import { ListSubscriptionsController } from './api/listSubscriptions'
import { GetGdprController } from './api/getGdpr'
import { DeleteGdprController } from './api/deleteGdpr'
import { CreateRefundController } from './api/createRefund'
import { ConfirmRefundController } from './api/confirmRefund'

const createController = new CreateController()
const cartToOrderController = new CartToOrder()
const cancelController = new (withAuthentication(CancelController))()
const confirmAndCreatePaymentController = new (withAuthentication(
  ConfirmAndCreatePayment
))()
const setCustomerController = new (withAuthentication(SetCustomerController))()
const addItemController = new (withAuthentication(AddItemController))()
const getController = new (withAuthentication(GetController))()
const getAdminController = new GetAdminController()
const getSubscriptionOrdersCtrl = new (withAuthentication(
  GetSubscriptionOrdersController
))()
const getSubscriptionCtrl = new (withAuthentication(
  getSubscriptionController
))()
const searchActiveSubscriptionsCtrl = new searchActiveSubscriptionsController()
const createSubscriptionCtrl = new createSubscriptionController()
const createSubscriptionsFromOrderCtrl = new createSubscriptionsFromOrderController()
const calculateTotalsController = new (withAuthentication(
  CalculateTotalsController
))()
const instantPurchaseController = new InstantPurchase()
const healthController = new Health()
const setSubscriptionItemMeta = new SetSubscriptionItemMetaController()
const cancelSubscription = new (withAuthentication(CancelSubscription))()
const sendSubscriptionContractEmail = new SendSubscriptionContractEmail()
const sendSubscriptionPaymentFailedEmail = new SendSubscriptionPaymentFailedEmail()
const recreateSubscription = new RecreateSubscriptionController()
const listSubscriptionsController = new ListSubscriptionsController()
// Authentication is already mixed in at the controller
const getGdprController = new GetGdprController()
const deleteGdprController = new DeleteGdprController()
const createRefundController = new CreateRefundController({
  confirmAndCreatePayment: false,
})
const instantRefundController = new CreateRefundController({
  confirmAndCreatePayment: true,
})
const confirmRefundController = new ConfirmRefundController()

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
router.post('/subscription/:id/meta/:itemId', (req, res) =>
  setSubscriptionItemMeta.execute(req, res)
)
router.post('/subscription/:id/emailSubscriptionContract', (req, res) =>
  sendSubscriptionContractEmail.execute(req, res)
)
router.post('/subscription/:id/emailSubscriptionPaymentFailed', (req, res) =>
  sendSubscriptionPaymentFailedEmail.execute(req, res)
)
router.post('/subscription/:id/recreate', (req, res) =>
  recreateSubscription.execute(req, res)
)
router.get('/subscriptions/get-by-order-id/:orderId', (req, res) =>
  listSubscriptionsController.execute(req, res)
)

router.post('/instantPurchase', (req, res) =>
  instantPurchaseController.execute(req, res)
)

router.get('/gdpr-api/v1/profiles/:id', (req, res) =>
  getGdprController.execute(req, res)
)

router.delete('/gdpr-api/v1/profiles/:id', (req, res) =>
  deleteGdprController.execute(req, res)
)

router.post('/refund', (req, res) => createRefundController.execute(req, res))

router.post('/refund/instant', (req, res) =>
  instantRefundController.execute(req, res)
)

router.post('/refund/:refundId/confirm', (req, res) =>
  confirmRefundController.execute(req, res)
)

export default router
