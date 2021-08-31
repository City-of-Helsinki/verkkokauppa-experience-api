import { AbstractController, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { parseOrderIdFromRedirect } from '../lib/vismaPay'
import { checkVismaReturnUrl } from '@verkkokauppa/payment-backend'

export class OnlinePaymentNotifyController extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(
    request: Request,
    result: Response
  ): Promise<any> {
    const { query } = request
    const vismaStatus = await checkVismaReturnUrl({ params: query })
    const orderId = parseOrderIdFromRedirect({ query })
    logger.debug(
      `VismaStatus callback for order ${orderId}: ${JSON.stringify(
        vismaStatus
      )}`
    )
    return this.success(result)
  }
}
