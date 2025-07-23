import {
  AbstractController,
  ExperienceError,
  logger,
  StatusCode,
} from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import {
  confirmOrder,
  createAccountingEntryForOrder,
  getOrderAdmin,
  lockOrder,
  unlockOrder,
} from '@verkkokauppa/order-backend'
import { URL } from 'url'
import {
  getPublicServiceConfiguration,
  parseMerchantIdFromFirstOrderItem,
} from '@verkkokauppa/configuration-backend'
import {
  checkPaytrailCardReturnUrl,
  paidPaymentExists,
  Payment,
  updateInternalPaymentFromPaytrail,
} from '@verkkokauppa/payment-backend'
import { sendReceiptToCustomer } from '../lib/sendEmail'
import { getProductAccountingBatch } from '@verkkokauppa/product-backend'
import { sendErrorNotification } from '@verkkokauppa/message-backend'

export class PaytrailCardRedirectSuccessController extends AbstractController {
  protected readonly requestSchema = null

  private static fault = (url: URL, user?: string) => {
    url.searchParams.append('paymentPaid', 'false')

    if (user) {
      url.searchParams.append('user', user)
    }

    return url
  }

  protected async implementation(req: Request, res: Response): Promise<any> {
    const globalRedirectUrl = process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE
    if (!globalRedirectUrl) {
      throw new Error('No default paytrail redirect url defined')
    }
    const { orderId } = req.params
    let successRedirectUrl = new URL(globalRedirectUrl)
    successRedirectUrl.pathname = `${orderId ?? ''}/success`
    let failureRedirectUrl = new URL(globalRedirectUrl)
    failureRedirectUrl.pathname = `${orderId ?? ''}/summary`

    let user = ''
    let lock = false
    try {
      if (!orderId) {
        return res.redirect(
          302,
          PaytrailCardRedirectSuccessController.fault(
            failureRedirectUrl
          ).toString()
        )
      }
      const order = await getOrderAdmin({ orderId })
      user = order.user

      const [nsSuccessRedirectUrl, nsFailureRedirectUrl] = await Promise.all([
        getPublicServiceConfiguration({
          namespace: order.namespace,
          key: 'ORDER_CREATED_REDIRECT_URL',
        }),
        getPublicServiceConfiguration({
          namespace: order.namespace,
          key: 'orderPaymentFailedRedirectUrl',
        }),
      ])

      if (nsSuccessRedirectUrl?.configurationValue) {
        successRedirectUrl = new URL(nsSuccessRedirectUrl.configurationValue)
        successRedirectUrl.pathname = 'success'
        successRedirectUrl.searchParams.append('orderId', orderId)
      }
      successRedirectUrl.searchParams.append('user', order.user)

      if (nsFailureRedirectUrl?.configurationValue) {
        failureRedirectUrl = new URL(nsFailureRedirectUrl.configurationValue)
        failureRedirectUrl.searchParams.append('orderId', orderId)
      }

      let retry = 0
      while (!(lock = await lockOrder(order))) {
        logger.info('order is already locked')
        if (retry > 2) {
          throw new ExperienceError({
            code: 'failed-to-lock-order',
            message: 'Exceeded max retry attempts trying to lock order',
            responseStatus: StatusCode.InternalServerError,
            logLevel: 'error',
          })
        }
        const wait = 5500 * 2 ** retry++
        logger.info(`waiting ${wait}ms to retry`)
        await new Promise((resolve) => setTimeout(resolve, wait))
      }

      if (await paidPaymentExists(order)) {
        return res.redirect(302, successRedirectUrl.toString())
      }

      // Now we confirm order and check if sums and other are ok. Mappings should be good now
      const confirmedOrder = await confirmOrder({ orderId, user: order.user })

      const payment = await checkPaytrailCardReturnUrl({
        params: req.query,
        order: confirmedOrder,
        merchantId: parseMerchantIdFromFirstOrderItem(confirmedOrder) || '',
      })

      if (payment.status !== 'payment_paid_online') {
        return res.redirect(
          302,
          PaytrailCardRedirectSuccessController.fault(
            failureRedirectUrl,
            user
          ).toString()
        )
      }
      let paymentWithUpdatePaidAt: Payment
      try {
        if (!payment) {
          throw new Error(
            `Card-redirect - Payment not found when updating internal payment from paytrail with orderId ${orderId}`
          )
        }
        paymentWithUpdatePaidAt = await updateInternalPaymentFromPaytrail({
          paymentId: payment.paymentId,
          merchantId: parseMerchantIdFromFirstOrderItem(order),
          namespace: order.namespace,
        })
      } catch (e) {
        logger.error(e)
        logger.debug(
          `Card-redirect - Error occurred, when updating payment data from paytrail ${orderId}`
        )
      }

      const paymentReturnStatus = {
        paymentPaid: payment.status === 'payment_paid_online',
        paymentType: payment.paymentType,
      }

      // send email receipt. Method does not throw exceptions
      try {
        await sendReceiptToCustomer(paymentReturnStatus, orderId, order)
      } catch (e) {
        logger.error(e)

        // send notification to Slack channel (email) that sending receipt failed
        await sendErrorNotification({
          message: `Sending receipt failed for paytrail card order ${orderId}`,
          cause: e.toString(),
          header: 'Error - Sending receipt failed',
        })
      }

      try {
        logger.info(`Load paytrail product accountings for order ${orderId}`)
        const productAccountings = await getProductAccountingBatch({
          productIds: order.items.map((item) => item.productId),
        })

        const accountingDtos = order.items.map((item) => {
          const productAccounting = productAccountings.find(
            (accountingData) => accountingData.productId === item.productId
          )
          if (!productAccounting) {
            throw new ExperienceError({
              code: 'failed-to-create-order-accounting-entry',
              message: `No accounting entry found for product ${item.productId}`,
              responseStatus: StatusCode.BadRequest,
              logLevel: 'error',
            })
          }
          return {
            ...item,
            ...productAccounting,
            merchantId: parseMerchantIdFromFirstOrderItem(order) || '',
            namespace: order.namespace,
            paytrailTransactionId:
              paymentWithUpdatePaidAt?.paytrailTransactionId || '',
            paidAt: paymentWithUpdatePaidAt?.paidAt || '',
          }
        })

        logger.info(
          `Create accounting entry for paytrail order ${orderId} with accountings ${JSON.stringify(
            productAccountings
          )}`
        )

        await createAccountingEntryForOrder({
          orderId,
          dtos: accountingDtos,
          namespace: order.namespace,
        })
      } catch (e) {
        // log error
        logger.error(
          'Creating accountings in paytrailCardRedirectSuccessController failed: ' +
            e.toString()
        )
        // send notification to Slack channel (email) that creating accountings failed
        await sendErrorNotification({
          message:
            'Creating accountings failed in paytrailCardRedirectSuccessController',
          cause: e.toString(),
          header: 'Error - Creating order accountings failed',
        })
      }

      return res.redirect(302, successRedirectUrl.toString())
    } catch (e) {
      logger.error(e)
      return res.redirect(
        302,
        PaytrailCardRedirectSuccessController.fault(
          failureRedirectUrl,
          user
        ).toString()
      )
    } finally {
      if (orderId && lock) {
        await unlockOrder({ orderId })
      }
    }
  }
}
