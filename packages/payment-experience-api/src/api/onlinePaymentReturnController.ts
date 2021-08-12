import { AbstractController, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { checkVismaStatus, createUserRedirectUrl } from '../lib/vismaPay'
import { URL } from 'url'
import { getOrder } from '@verkkokauppa/order-backend'

export class OnlinePaymentReturnController extends AbstractController {
  protected async implementation(
    request: Request,
    result: Response
  ): Promise<any> {
    const { query } = request
    if (!process.env.REDIRECT_PAYMENT_URL_BASE) {
      return this.fail(result, 'No default redirect url specified')
    }
    try {
      const vismaStatus = checkVismaStatus({ query })
      const orderId = query.ORDER_NUMBER?.toString()
      if (!orderId) {
        return this.fail(result, 'No orderId specified')
      }
      const order = await getOrder({ orderId })
      const redirectUrl = createUserRedirectUrl({
        order,
        vismaStatus,
      })
      return result.redirect(302, redirectUrl.toString())
    } catch (error) {
      logger.error(error)
      const redirectUrl = new URL(process.env.REDIRECT_PAYMENT_URL_BASE)
      redirectUrl.pathname = 'failure'

      return result.redirect(302, redirectUrl.toString())
    }
  }
}
