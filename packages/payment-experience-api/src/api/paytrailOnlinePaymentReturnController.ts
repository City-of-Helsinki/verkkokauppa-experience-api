import { AbstractController, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { URL } from 'url'
import { getOrderAdmin } from '@verkkokauppa/order-backend'
import {
  cancelPaymentAdmin,
  checkPaytrailReturnUrl,
  getPaidPaymentAdmin,
  getPaymentsForOrderAdmin,
  Order,
  PaymentStatus,
  updateInternalPaymentFromPaytrail,
} from '@verkkokauppa/payment-backend'
import { sendReceiptToCustomer } from '../lib/sendEmail'
import { parseOrderIdFromPaytrailRedirect } from '../lib/paytrail'
import {
  createUserRedirectUrl,
  isAuthorized,
  isCardRenewal,
} from '../lib/paymentReturnService'
import {
  getPublicServiceConfiguration,
  parseMerchantIdFromFirstOrderItem,
} from '@verkkokauppa/configuration-backend'

export class PaytrailOnlinePaymentReturnController extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(
    request: Request,
    result: Response
  ): Promise<any> {
    const { query } = request
    // Validates that base redirect url is set
    PaytrailOnlinePaymentReturnController.checkAndCreateRedirectUrl()
    const orderId = parseOrderIdFromPaytrailRedirect({ query })

    let failureRedirectUrl = PaytrailOnlinePaymentReturnController.checkAndCreateRedirectUrl()
    failureRedirectUrl.pathname = 'failure'

    if (!orderId) {
      logger.error(
        'No orderId specified redirect to paytrail general failure url'
      )
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

      try {
        if (!payment) {
          throw new Error(
            `Payment not found when updating internal payment from paytrail with orderId ${orderId}`
          )
        }
        await updateInternalPaymentFromPaytrail({
          paymentId: payment.paymentId,
          merchantId: parseMerchantIdFromFirstOrderItem(order),
          namespace: order.namespace,
        })
      } catch (e) {
        logger.error(e)
        logger.debug(
          `Error occurred, when updating payment data from paytrail ${orderId}`
        )
      }

      // Already found payment paid, return early to prevent multiple events happening
      if (payment != null && payment.status === 'payment_paid_online') {
        // successfully paid so redirect to success
        let url: URL = new URL(
          PaytrailOnlinePaymentReturnController.getRedirectUrl()
        )
        url.pathname = `${orderId}/success`
        url.searchParams.append('user', order.user)
        return result.redirect(302, url.toString())
      } else if (payment != null) {
        // redirect to failure
        return result.redirect(302, failureRedirectUrl.toString())
      }

      const merchantId = parseMerchantIdFromFirstOrderItem(order)

      if (!merchantId) {
        logger.error('Paytrail: No merchantId found from order')
        return result.redirect(302, failureRedirectUrl.toString())
      }

      const paytrailStatus = await checkPaytrailReturnUrl({
        params: query,
        merchantId: merchantId,
      })
      logger.debug(
        `PaytrailStatus for order ${orderId}: ${JSON.stringify(paytrailStatus)}`
      )
      if (!paytrailStatus.valid) {
        logger.debug(
          `PaytrailStatus is not valid for ${orderId}, redirect to failure url`
        )
        return result.redirect(302, failureRedirectUrl.toString())
      }

      const redirectUrl = await createUserRedirectUrl({
        order,
        paymentReturnStatus: paytrailStatus,
        redirectPaymentUrlBase: PaytrailOnlinePaymentReturnController.getRedirectUrl(),
      })
      // Function contains internal checks when to send receipt.
      await sendReceiptToCustomer(paytrailStatus, orderId, order)

      // Only cancel authorized card renewals.
      if (isAuthorized(paytrailStatus) && isCardRenewal(paytrailStatus)) {
        const cancelled = await this.cancelAuthorizationPayments(order)
        // Error count more than 0
        let cancelledCount = cancelled[1]
        if (cancelledCount != 0) {
          return result.redirect(
            302,
            PaytrailOnlinePaymentReturnController.getCardRenewalFailureRedirectUrl(
              order.orderId,
              order.user
            ).toString()
          )
        }
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

  private static getCardRenewalFailureRedirectUrl(
    orderId: string,
    user: string
  ) {
    const redirectUrl = this.checkAndCreateRedirectUrl()
    redirectUrl.pathname = `${orderId}/card-update-failed`

    redirectUrl.searchParams.append('user', user)

    return redirectUrl.toString()
  }

  public async cancelAuthorizationPayments(order: Order) {
    let failCount = 0
    let successCount = 0
    const cancellablePayments = await getPaymentsForOrderAdmin(
      order,
      PaymentStatus.AUTHORIZED
    )
    for (const [, payment] of Object.entries(cancellablePayments)) {
      const result = await cancelPaymentAdmin(payment.paymentId)
      if (result.result === 0) {
        logger.info(
          `Payment cancellation successfully with payment id : ${payment.paymentId} `
        )
        successCount++
      } else {
        logger.info(
          `Payment cancellation with payment id : ${payment.paymentId} failed`
        )
        failCount++
      }
    }
    return [successCount, failCount]
  }
}
