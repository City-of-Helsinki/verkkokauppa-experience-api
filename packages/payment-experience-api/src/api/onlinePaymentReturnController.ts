import { AbstractController, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { parseOrderIdFromRedirect } from '../lib/vismaPay'
import { URL } from 'url'
import { getOrderAdmin } from '@verkkokauppa/order-backend'
import {
  cancelPaymentAdmin,
  checkVismaReturnUrl,
  getPaymentsForOrderAdmin,
  Order,
  PaymentStatus,
} from '@verkkokauppa/payment-backend'
import { sendReceiptToCustomer } from '../lib/sendEmail'
import {
  createUserRedirectUrl,
  isAuthorized,
  isCardRenewal,
} from '../lib/paymentReturnService'

export class OnlinePaymentReturnController extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(
    request: Request,
    result: Response
  ): Promise<any> {
    const { query } = request
    if (!process.env.REDIRECT_PAYMENT_URL_BASE) {
      throw new Error('No default redirect url specified')
    }
    const orderId = parseOrderIdFromRedirect({ query })

    if (!orderId) {
      logger.error('No orderId specified redirect to general failure url')
      return result.redirect(
        302,
        OnlinePaymentReturnController.getFailureRedirectUrl().toString()
      )
    }

    try {
      const vismaStatus = await checkVismaReturnUrl({ params: query })
      logger.debug(
        `VismaStatus for order ${orderId}: ${JSON.stringify(vismaStatus)}`
      )
      if (!vismaStatus.valid) {
        logger.debug(
          `VismaStatus is not valid for ${orderId}, redirect to failure url`
        )
        return result.redirect(
          302,
          OnlinePaymentReturnController.getFailureRedirectUrl().toString()
        )
      }

      const order = await getOrderAdmin({ orderId })
      const redirectUrl = await createUserRedirectUrl({
        order,
        paymentReturnStatus: vismaStatus,
        redirectPaymentUrlBase: OnlinePaymentReturnController.getRedirectUrl(),
      })
      // Function contains internal checks when to send receipt.
      await sendReceiptToCustomer(vismaStatus, orderId, order)

      // Only cancel authorized card renewals.
      if (isAuthorized(vismaStatus) && isCardRenewal(vismaStatus)) {
        const cancelled = await this.cancelAuthorizationPayments(order)
        // Error count more than 0
        let cancelledCount = cancelled[1]
        if (cancelledCount != 0) {
          return result.redirect(
            302,
            OnlinePaymentReturnController.getCardRenewalFailureRedirectUrl(
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
        OnlinePaymentReturnController.getFailureRedirectUrl().toString()
      )
    }
  }

  private static getFailureRedirectUrl() {
    if (!process.env.REDIRECT_PAYMENT_URL_BASE) {
      throw new Error('No default visma redirect url specified')
    }
    const redirectUrl = new URL(process.env.REDIRECT_PAYMENT_URL_BASE)
    redirectUrl.pathname = 'failure'

    return redirectUrl.toString()
  }

  private static getCardRenewalFailureRedirectUrl(orderId: string) {
    const redirectUrl = this.checkAndCreateRedirectUrl()
    redirectUrl.pathname = `${orderId}/card-update-failed`

    return redirectUrl.toString()
  }

  private static checkAndCreateRedirectUrl() {
    if (!process.env.REDIRECT_PAYMENT_URL_BASE) {
      throw new Error('No default visma redirect url specified')
    }
    return new URL(process.env.REDIRECT_PAYMENT_URL_BASE)
  }

  public static getRedirectUrl() {
    if (!process.env.REDIRECT_PAYMENT_URL_BASE) {
      throw new Error('No default visma redirect url specified')
    }
    return process.env.REDIRECT_PAYMENT_URL_BASE
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
