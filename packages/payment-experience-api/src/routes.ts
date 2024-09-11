import { Router } from 'express'

import { CreatePaymentController } from './api/createPaymentController'
import { GetPaymentMethodListController } from './api/getPaymentMethodListController'
import { OnlinePaymentReturnController } from './api/onlinePaymentReturnController'
import { OnlinePaymentNotifyController } from './api/onlinePaymentNotifyController'
import { GetPaymentController } from './api/getPaymentController'
import { Health } from './api/health'
import { GetPaymentAdminController } from './api/getPaymentAdminController'
import { withAuthentication } from '@verkkokauppa/auth-helsinki-profile'
import { SubscriptionTokenizeController } from './api/subscriptionTokenizeController'
import { SendReceiptPaymentAdminInternalController } from './api/sendReceiptPaymentAdminInternalController'
import { PaytrailOnlinePaymentReturnController } from './api/paytrailOnlinePaymentReturnController'
import { PaytrailOnlinePaymentNotifyController } from './api/paytrailOnlinePaymentNotifyController'
import { PaytrailOnlineRefundPaymentSuccessController } from './api/paytrailOnlineRefundPaymentSuccessController'
import { GetCardFormParametersController } from './api/getCardFormParametersController'
import { PaytrailCardRedirectSuccessController } from './api/paytrailCardRedirectSuccessController'
import { PaytrailCardRedirectCancelController } from './api/paytrailCardRedirectCancelController'
import { InstantRefundController } from './api/instantRefundController'
import { GetRefundPaymentAdminController } from './api/getRefundPaymentAdminController'
import { GetUpdateCardFormParametersController } from './api/getUpdateCardFormParametersController'
import { PaytrailCardUpdateRedirectSuccessController } from './api/paytrailCardUpdateRedirectSuccessController'
import { PaytrailOnlineRefundPaymentCancelController } from './api/paytrailOnlineRefundPaymentCancelController'
import { InvoicingRedirectController } from './api/invoicingRedirectController'
import { PaytrailMitChargeNotifyController } from './api/paytrailMitChargeNotifyController'

const createPaymentController = new (withAuthentication(
  CreatePaymentController
))()
const getPaymentMethodListCtrl = new (withAuthentication(
  GetPaymentMethodListController
))()
const getCardFormParametersController = new (withAuthentication(
  GetCardFormParametersController
))()
const getUpdateCardFormParametersController = new (withAuthentication(
  GetUpdateCardFormParametersController
))()
const onlinePaymentReturnController = new OnlinePaymentReturnController()
const paytrailOnlinePaymentReturnController = new PaytrailOnlinePaymentReturnController()
const sendReceiptPaymentAdminInternalController = new SendReceiptPaymentAdminInternalController()
const onlinePaymentNotifyController = new OnlinePaymentNotifyController()
const paytrailOnlinePaymentNotifyController = new PaytrailOnlinePaymentNotifyController()
const paytrailOnlineRefundPaymentSuccessController = new PaytrailOnlineRefundPaymentSuccessController()
const paytrailOnlineRefundPaymentCancelController = new PaytrailOnlineRefundPaymentCancelController()
const getPaymentController = new (withAuthentication(GetPaymentController))()
const getPaymentAdminController = new GetPaymentAdminController()
const getRefundPaymentAdminController = new GetRefundPaymentAdminController()
const healthController = new Health()
const subscriptionTokenizeController = new SubscriptionTokenizeController()
const paytrailCardRedirectSuccessController = new PaytrailCardRedirectSuccessController()
const paytrailCardRedirectCancelController = new PaytrailCardRedirectCancelController()
const instantRefundController = new InstantRefundController()
const paytrailCardUpdateRedirectSuccessController = new PaytrailCardUpdateRedirectSuccessController()
const invoicingRedirectController = new InvoicingRedirectController()
const paytrailMitChargeNotifyController = new PaytrailMitChargeNotifyController()

const router = Router()
router.get('/health', (req, res) => healthController.execute(req, res))
router.get('/:orderId', (req, res) => getPaymentController.execute(req, res))
router.get('/admin/:orderId', (req, res) =>
  getPaymentAdminController.execute(req, res)
)
router.post('/:orderId', (req, res) =>
  createPaymentController.execute(req, res)
)
router.get('/:orderId/paymentMethods', (req, res) =>
  getPaymentMethodListCtrl.execute(req, res)
)
router.get('/:orderId/cardFormParameters', (req, res) =>
  getCardFormParametersController.execute(req, res)
)
router.get('/:orderId/updateCardFormParameters', (req, res) =>
  getUpdateCardFormParametersController.execute(req, res)
)
router.get('/onlinePayment/return', (req, res) =>
  onlinePaymentReturnController.execute(req, res)
)
router.get('/paytrailOnlinePayment/return/:status', (req, res) =>
  paytrailOnlinePaymentReturnController.execute(req, res)
)
router.get('/onlinePayment/notify', (req, res) =>
  onlinePaymentNotifyController.execute(req, res)
)
router.get('/paytrailOnlinePayment/notify/:status', (req, res) =>
  paytrailOnlinePaymentNotifyController.execute(req, res)
)
router.get('/paytrailOnlinePayment/mitCharge/notify', (req, res) =>
  paytrailMitChargeNotifyController.execute(req, res)
)
router.get('/paytrailOnlineRefund/success', (req, res) =>
  paytrailOnlineRefundPaymentSuccessController.execute(req, res)
)
router.get('/paytrailOnlineRefund/cancel', (req, res) =>
  paytrailOnlineRefundPaymentCancelController.execute(req, res)
)
router.get('/subscription/:subscriptionId/tokenize', (req, res) =>
  subscriptionTokenizeController.execute(req, res)
)

router.get('/send/receipt/:orderId', (req, res) =>
  sendReceiptPaymentAdminInternalController.execute(req, res)
)
router.get('/paytrailCard/redirect/success/:orderId', (req, res) =>
  paytrailCardRedirectSuccessController.execute(req, res)
)
router.get('/paytrailCard/redirect/cancel/:orderId', (req, res) =>
  paytrailCardRedirectCancelController.execute(req, res)
)
router.get('/paytrailCardUpdate/redirect/success/:orderId', (req, res) =>
  paytrailCardUpdateRedirectSuccessController.execute(req, res)
)
router.post('/refund/instant/:orderId', (req, res) =>
  instantRefundController.execute(req, res)
)

router.get('/admin/refund-payment/:refundId', (req, res) =>
  getRefundPaymentAdminController.execute(req, res)
)
router.get('/invoice/redirect', (req, res) =>
  invoicingRedirectController.execute(req, res)
)

export default router
