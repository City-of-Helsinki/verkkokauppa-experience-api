import {
  AbstractController,
  ExperienceFailure,
  logger,
} from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import {
  createUserRedirectUrl,
  isAuthorized,
  parseOrderIdFromRedirect,
} from '../lib/vismaPay'
import { URL } from 'url'
import { getOrderAdmin } from '@verkkokauppa/order-backend'
import {
  cancelPaymentAdmin,
  checkVismaReturnUrl,
  getPaymentForOrder,
  getPaymentsForOrderAdmin,
  Order,
} from '@verkkokauppa/payment-backend'
import { getMerchantDetailsForOrder } from '@verkkokauppa/configuration-backend'
import { sendEmailToCustomer } from '@verkkokauppa/message-backend'
import { PaymentStatus } from '@verkkokauppa/payment-backend/dist/enums'

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
        vismaStatus,
      })
      if (vismaStatus.paymentPaid) {
        logger.info(`Send receipt for order ${orderId}`)
        try {
          await this.sendReceipt(order)
        } catch (e) {
          // Skip errors for receipt sending
          logger.error(e)
        }
      }
      if (isAuthorized(vismaStatus)) {
        const cancelled = await this.cancelAuthorizationPayments(order)
        // Error count more than 0
        if (cancelled[1] != 0) {
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
      throw new Error('No default redirect url specified')
    }
    const redirectUrl = new URL(process.env.REDIRECT_PAYMENT_URL_BASE)
    redirectUrl.pathname = 'failure'

    return redirectUrl.toString()
  }

  private static getCardRenewalFailureRedirectUrl(orderId: string) {
    if (!process.env.REDIRECT_PAYMENT_URL_BASE) {
      throw new Error('No default redirect url specified')
    }
    const redirectUrl = new URL(process.env.REDIRECT_PAYMENT_URL_BASE)
    redirectUrl.pathname = `${orderId}/card-update-success`

    return redirectUrl.toString()
  }

  public async sendReceipt(order: Order) {
    const payments = await getPaymentForOrder(order)
    const merchant = await getMerchantDetailsForOrder(order)
    const orderWithPayments = {
      ...order,
      payment: payments,
      merchant,
    }
    const email = await sendEmailToCustomer({
      order: orderWithPayments,
      fileName: 'orderConfirmation',
      emailHeader:
        'Tilausvahvistus ja kuitti / Order confirmation and receipt / Beställningsbekräftelse och kvitto',
      sendTo: orderWithPayments?.customer?.email || '',
    })
    if (email.error !== '') {
      throw new ExperienceFailure({
        code: 'failed-to-send-order-confirmation-email',
        message: `Cannot send order confirmation email to customer`,
        source: email.error,
      })
    }
    return email
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
