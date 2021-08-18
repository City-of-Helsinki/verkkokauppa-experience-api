import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getPaymentForOrder } from '@verkkokauppa/payment-backend'
import { getOrder } from '@verkkokauppa/order-backend'

export class GetPaymentController extends AbstractController {
  protected async implementation(
    request: Request,
    result: Response
  ): Promise<any> {
    const { orderId } = request.params
    if (orderId === undefined) {
      return this.clientError(result, 'Order ID not specified')
    }

    const dto = new Data()
    try {
      const order = await getOrder({ orderId })
      dto.data = await getPaymentForOrder(order)
    } catch (error) {
      logger.error(error)
      return this.fail(result, error.toString())
    }

    return this.created<any>(result, dto.serialize())
  }
}
