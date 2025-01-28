import { AbstractController, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { URL } from 'url'
import { getOrderAdmin, setOrderAsAccounted } from '@verkkokauppa/order-backend'
import {
  checkFreeReturnUrl,
  getPaidPaymentAdmin,
} from '@verkkokauppa/payment-backend'
import { sendReceiptToCustomer } from '../lib/sendEmail'
import {
  createUserRedirectUrl,
  isAuthorized,
  isCardRenewal,
} from '../lib/paymentReturnService'
import {
  getPublicServiceConfiguration,
  parseMerchantIdFromFirstOrderItem,
} from '@verkkokauppa/configuration-backend'
import { sendErrorNotification } from '@verkkokauppa/message-backend'

export class FreePaymentReturnController extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(
    request: Request,
    result: Response
  ): Promise<any> {
    const {
      query: { orderId },
    } = request

    // Validates that base redirect url is set
    FreePaymentReturnController.checkAndCreateRedirectUrl()

    let failureRedirectUrl = FreePaymentReturnController.checkAndCreateRedirectUrl()
    failureRedirectUrl.pathname = 'failure'

    if (typeof orderId !== 'string') {
      logger.error('orderId is not string')
      return result.redirect(302, failureRedirectUrl.toString())
    }

    if (!orderId) {
      logger.error('No orderId specified redirect to free general failure url')
      return result.redirect(302, failureRedirectUrl.toString())
    }

    try {
      const order = await getOrderAdmin({ orderId })

      const nsFailureRedirectUrl = await getPublicServiceConfiguration({
        namespace: order.namespace,
        key: 'orderPaymentFailedRedirectUrl',
      })

      if (nsFailureRedirectUrl?.configurationValue) {
        failureRedirectUrl = new URL(nsFailureRedirectUrl.configurationValue)
      }

      const payment = await getPaidPaymentAdmin({
        orderId: orderId,
      })

      // Already found payment paid, return early to prevent multiple events happening
      if (payment != null && payment.status === 'payment_paid_online') {
        // successfully paid so redirect to success
        let url: URL = new URL(FreePaymentReturnController.getRedirectUrl())
        url.pathname = `${orderId}/success`
        url.searchParams.append('user', order.user)
        return result.redirect(302, url.toString())
      } else if (payment != null) {
        // redirect to failure
        return result.redirect(302, failureRedirectUrl.toString())
      }

      const merchantId = parseMerchantIdFromFirstOrderItem(order)

      if (!merchantId) {
        logger.error('Free: No merchantId found from order')
        return result.redirect(302, failureRedirectUrl.toString())
      }

      const paymentStatus = await checkFreeReturnUrl({
        orderId: orderId,
        merchantId: merchantId,
      })
      logger.debug(
        `PaymentStatus for order ${orderId}: ${JSON.stringify(paymentStatus)}`
      )
      if (!paymentStatus.valid) {
        logger.debug(
          `PaymentStatus is not valid for ${orderId}, redirect to failure url`
        )
        return result.redirect(302, failureRedirectUrl.toString())
      }

      try {
        await setOrderAsAccounted(orderId)
      } catch (e) {
        logger.error(e)
        logger.debug(
          `Error occurred when trying to set free order as accounted ${orderId}`
        )
      }

      const redirectUrl = await createUserRedirectUrl({
        order,
        paymentReturnStatus: paymentStatus,
        redirectPaymentUrlBase: FreePaymentReturnController.getRedirectUrl(),
      })

      // Function contains internal checks when to send receipt.
      try {
        await sendReceiptToCustomer(paymentStatus, orderId, order)
      } catch (e) {
        logger.error(e)

        // send notification to Slack channel (email) that sending receipt failed
        await sendErrorNotification({
          message: `Sending receipt failed for free order ${orderId}`,
          cause: e.toString(),
        })
      }

      // Only cancel authorized card renewals.
      if (isAuthorized(paymentStatus) && isCardRenewal(paymentStatus)) {
        logger.error(
          `Error occurred, tried to do card renewal for free payment ${orderId}`
        )
      }

      return result.redirect(302, redirectUrl.toString())
    } catch (e) {
      logger.error(e)
      logger.debug(
        `Error occurred, redirect user to failure url for order ${orderId}`
      )
      return result.redirect(302, failureRedirectUrl.toString())
    }
  }

  public static checkAndCreateRedirectUrl() {
    if (!process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE) {
      throw new Error('No default paytrail redirect url specified')
    }
    return new URL(process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE)
  }

  public static getRedirectUrl() {
    if (!process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE) {
      throw new Error('No default paytrail redirect url specified')
    }
    return process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE
  }
}
