import {
  AbstractController,
  ExperienceError,
  logger,
  StatusCode,
} from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { URL } from 'url'
import { getOrderAdmin, getRefundAdmin } from '@verkkokauppa/order-backend'
import {
  cancelPaymentAdmin,
  checkPaytrailRefundCallbackUrl,
  getPaymentsForOrderAdmin,
  Order,
  PaymentStatus,
} from '@verkkokauppa/payment-backend'
import {
  createUserRedirectUrl,
  isAuthorized,
  isCardRenewal,
} from '../lib/paymentReturnService'
import { parseUuidFromPaytrailRedirectCheckoutStamp } from '../lib/paytrail'
import { parseMerchantIdFromFirstOrderItem } from '@verkkokauppa/configuration-backend'

export class PaytrailOnlineRefundPaymentSuccessController extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(
    request: Request,
    result: Response
  ): Promise<any> {
    const { query } = request
    // Validates that base redirect url is set
    PaytrailOnlineRefundPaymentSuccessController.checkAndCreateRedirectUrl()
    const refundId = parseUuidFromPaytrailRedirectCheckoutStamp({ query })

    if (!refundId) {
      logger.error(
        'No refundId specified redirect to paytrail general failure url'
      )
      return result.redirect(
        302,
        PaytrailOnlineRefundPaymentSuccessController.getFailureRedirectUrl()
      )
    }

    const refund = await getRefundAdmin({ refundId })
    const orderId = refund.refund.orderId
    const order = await getOrderAdmin({ orderId })
    const merchantId = parseMerchantIdFromFirstOrderItem(order)

    if (!merchantId) {
      logger.error('Paytrail: No merchantId found from order')
      throw new ExperienceError({
        code: 'merchant-id-not-found',
        message: 'No merchantId found from order.',
        responseStatus: StatusCode.NotFound,
        logLevel: 'info',
      })
    }

    try {
      const paytrailStatus = await checkPaytrailRefundCallbackUrl({
        params: query,
        merchantId: merchantId,
      })
      logger.debug(
        `PaytrailStatus for refund ${refundId}: ${JSON.stringify(
          paytrailStatus
        )}`
      )
      if (!paytrailStatus.valid) {
        logger.debug(
          `PaytrailStatus is not valid for refund ${refundId}, redirect to failure url`
        )
        return result.redirect(
          302,
          PaytrailOnlineRefundPaymentSuccessController.getFailureRedirectUrl()
        )
      }

      const redirectUrl = await createUserRedirectUrl({
        order,
        paymentReturnStatus: paytrailStatus,
        redirectPaymentUrlBase: PaytrailOnlineRefundPaymentSuccessController.getRedirectUrl(),
      })
      // TODO: Make changes that sends email from refund
      // Function contains internal checks when to send receipt.
      // await sendReceiptToCustomer(paytrailStatus, orderId, order)

      // Only cancel authorized card renewals.
      if (isAuthorized(paytrailStatus) && isCardRenewal(paytrailStatus)) {
        const cancelled = await this.cancelAuthorizationPayments(order)
        // Error count more than 0
        let cancelledCount = cancelled[1]
        if (cancelledCount != 0) {
          return result.redirect(
            302,
            PaytrailOnlineRefundPaymentSuccessController.getCardRenewalFailureRedirectUrl(
              order.orderId
            ).toString()
          )
        }
      }

      return result.redirect(302, redirectUrl.toString())
    } catch (error) {
      logger.error(error)
      logger.debug(
        `Error occurred, redirect user to failure url for order ${orderId}`
      )
      return result.redirect(
        302,
        PaytrailOnlineRefundPaymentSuccessController.getFailureRedirectUrl().toString()
      )
    }
  }

  private static getFailureRedirectUrl() {
    const redirectUrl = this.checkAndCreateRedirectUrl()
    redirectUrl.pathname = 'failure'

    return redirectUrl.toString()
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

  private static getCardRenewalFailureRedirectUrl(orderId: string) {
    const redirectUrl = this.checkAndCreateRedirectUrl()
    redirectUrl.pathname = `${orderId}/card-update-failed`

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
