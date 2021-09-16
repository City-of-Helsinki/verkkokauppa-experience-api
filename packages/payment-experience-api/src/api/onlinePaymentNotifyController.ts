import { AbstractController, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { parseOrderIdFromRedirect } from '../lib/vismaPay'
import {
  checkVismaReturnUrl,
  getPaymentForOrder,
  Order,
} from '@verkkokauppa/payment-backend'
import { getOrderAdmin, OrderNotFoundError } from '@verkkokauppa/order-backend'
import { sendEmailToCustomer } from '@verkkokauppa/message-backend'

export class OnlinePaymentNotifyController extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(
    request: Request,
    response: Response
  ): Promise<any> {
    const { query } = request
    const vismaStatus = await checkVismaReturnUrl({ params: query })
    const orderId = parseOrderIdFromRedirect({ query })

    if (!orderId) {
      logger.error('No orderId specified')
      throw new OrderNotFoundError()
    }
    const order = await getOrderAdmin({ orderId })
    if (vismaStatus.paymentPaid) {
      await OnlinePaymentNotifyController.sendReceipt(order)
    }
    logger.debug(
      `VismaStatus callback for order ${orderId}: ${JSON.stringify(
        vismaStatus
      )}`
    )
    return this.success<any>(response, vismaStatus)
  }

  static async sendReceipt(order: Order) {
    try {
      let payments = await getPaymentForOrder(order)

      let orderWithPayments = { ...order, payment: payments }
      const email = await sendEmailToCustomer({
        order: orderWithPayments,
        fileName: 'orderConfirmation',
        emailHeader: 'emailHeader',
        sendTo: orderWithPayments?.customer?.email || '',
      })
      if (email.error !== '') {
        throw new Error(email.error)
      }
      return email
    } catch (e) {
      // Do not stop redirecting if email sending fails.
      console.log(
        `orderConfirmation email was not sent for order ${
          order.orderId
        } error: ${e.toString()}`
      )
      console.error(e)
    }
  }
}
