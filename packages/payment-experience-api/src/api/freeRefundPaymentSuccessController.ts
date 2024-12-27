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
  checkFreeRefundCallbackUrl,
  getPaidRefundPaymentAdminByRefundId,
} from '@verkkokauppa/payment-backend'
import { createUserRefundRedirectUrl } from '../lib/refundCallbackService'
import { parseRefundIdFromPaytrailRefundCallbackUrl } from '../lib/paytrail'
import { parseMerchantIdFromFirstOrderItem } from '@verkkokauppa/configuration-backend'

export class FreeRefundPaymentSuccessController extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(
    request: Request,
    result: Response
  ): Promise<any> {
    const { query } = request
    // Validates that base redirect url is set
    FreeRefundPaymentSuccessController.checkAndCreateRedirectUrl()
    const refundId = parseRefundIdFromPaytrailRefundCallbackUrl({ query })

    if (!refundId) {
      logger.error(
        'No refundId specified redirect to paytrail general failure url'
      )
      return result.redirect(
        302,
        FreeRefundPaymentSuccessController.getFailureRedirectUrl()
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

    const refundPayment = await getPaidRefundPaymentAdminByRefundId({
      refundId: refundId,
    })

    // Already found refundPayment paid, return early to prevent multiple events happening
    if (refundPayment != null) {
      logger.debug(
        `Paid payment already found for this refund, quitting early. Refund id: ${refundId}`
      )
      return result.redirect(
        200,
        FreeRefundPaymentSuccessController.getFailureRedirectUrl()
      )
    }

    try {
      const paytrailStatus = await checkFreeRefundCallbackUrl({
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
          FreeRefundPaymentSuccessController.getFailureRedirectUrl()
        )
      }

      const redirectUrl = await createUserRefundRedirectUrl({
        order,
        refundPaymentStatus: paytrailStatus,
        redirectPaymentUrlBase: FreeRefundPaymentSuccessController.getRefundRedirectUrl(),
      })
      // TODO: Make changes that sends email from refund
      // Function contains internal checks when to send receipt.
      // await sendReceiptToCustomer(paytrailStatus, orderId, order)

      return result.redirect(302, redirectUrl.toString())
    } catch (error) {
      logger.error(error)
      logger.debug(
        `Error occurred, redirect user to failure url for refund ${refundId}`
      )
      return result.redirect(
        302,
        FreeRefundPaymentSuccessController.getFailureRedirectUrl().toString()
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

  private static getRefundRedirectUrl() {
    const redirectUrl = this.checkAndCreateRedirectUrl()
    redirectUrl.pathname = `refund`

    return redirectUrl.toString()
  }
}
