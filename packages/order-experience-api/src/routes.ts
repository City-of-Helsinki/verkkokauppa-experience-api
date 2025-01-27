import { Router } from 'express'

import { CreateController } from './api/createController'
import { CartToOrder } from './api/cartToOrder'
import { CancelController } from './api/cancelController'
import { SetCustomerController } from './api/setCustomerController'
import { SetInvoiceController } from './api/setInvoiceController'
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
import { SendSubscriptionCardExpiredEmail } from './api/sendSubscriptionCardExpiredEmail'
import { CreateFlowStepController } from './api/createFlowStepController'
import { SetPaymentMethodController } from './api/setPaymentMethodController'
import { SendRefundEmailController } from './api/sendRefundEmail'
import { HandleInternalWebhooks } from './api/handleInternalWebhooks'
import { GetCancelController } from './api/getCancelUrlController'
import { GetRefundController } from './api/getRefund'

const createController = new CreateController()
const cartToOrderController = new CartToOrder()
const cancelController = new (withAuthentication(CancelController))()
const getCancelController = new (withAuthentication(GetCancelController))()
const confirmAndCreatePaymentController = new (withAuthentication(
  ConfirmAndCreatePayment
))()
const setCustomerController = new (withAuthentication(SetCustomerController))()
const setInvoiceController = new (withAuthentication(SetInvoiceController))()
const setPaymentMethodController = new (withAuthentication(
  SetPaymentMethodController
))()
const addItemController = new (withAuthentication(AddItemController))()
const createFlowStepController = new (withAuthentication(
  CreateFlowStepController
))()
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
const sendSubscriptionCardExpiredEmail = new SendSubscriptionCardExpiredEmail()
const handleInternalWebhooks = new HandleInternalWebhooks()
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
const getRefundController = new GetRefundController()
const sendRefundEmailController = new SendRefundEmailController()

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
router.post('/:orderId/invoice', (req, res) =>
  setInvoiceController.execute(req, res)
)
router.post('/:orderId/paymentMethod', (req, res) =>
  setPaymentMethodController.execute(req, res)
)
router.post('/:orderId/items', (req, res) =>
  addItemController.execute(req, res)
)
router.post('/:orderId/flowSteps', (req, res) =>
  createFlowStepController.execute(req, res)
)
router.post('/:orderId/cancel', (req, res) =>
  cancelController.execute(req, res)
)
router.get('/:orderId/getCancelUrl', (req, res) =>
  getCancelController.execute(req, res)
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
router.post('/subscription/:id/emailSubscriptionCardExpired', (req, res) =>
  sendSubscriptionCardExpiredEmail.execute(req, res)
)
router.post('/internal/webhooks', (req, res) =>
  handleInternalWebhooks.execute(req, res)
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

router.get('/gdpr-api/v1/profiles/tunnistus/:id', (req, res) => {
  // Set the `auth-server-type` header to "KEYCLOAK"
  req.headers['x-auth-server-type'] = 'KEYCLOAK'

  // Execute the controller with the modified request header
  return getGdprController.execute(req, res)
})

router.delete('/gdpr-api/v1/profiles/tunnistus/:id', (req, res) => {
  // Set the `auth-server-type` header to "KEYCLOAK"
  req.headers['x-auth-server-type'] = 'KEYCLOAK'
  // Execute the controller with the modified request header
  return deleteGdprController.execute(req, res)
})

router.post('/refund', (req, res) => createRefundController.execute(req, res))

router.post('/refund/instant', (req, res) =>
  instantRefundController.execute(req, res)
)

router.post('/refund/:refundId/confirm', (req, res) =>
  confirmRefundController.execute(req, res)
)

router.get('/refund/:refundId', (req, res) =>
  getRefundController.execute(req, res)
)

router.post('/refund/:refundId/emailRefundConfirmation', (req, res) =>
  sendRefundEmailController.execute(req, res)
)

export default router
