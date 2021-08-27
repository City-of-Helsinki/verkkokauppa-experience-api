import { AbstractController, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { parseOrderIdFromRedirect } from '../lib/vismaPay'
import { checkVismaReturnUrl } from '@verkkokauppa/payment-backend'

export class OnlinePaymentNotifyController extends AbstractController {
  protected async implementation(
    request: Request,
    result: Response
  ): Promise<any> {
    const { query } = request
    try {
      const vismaStatus = await checkVismaReturnUrl({ params: query })
      const orderId = parseOrderIdFromRedirect({ query })
      console.log(
        `VismaStatus callback for order ${orderId}: ${JSON.stringify(
          vismaStatus
        )}`
      )
      return this.success(result)
    } catch (error) {
      logger.error(error)
      return this.fail(result, 'Cannot validate notify callback')
    }
  }
}
