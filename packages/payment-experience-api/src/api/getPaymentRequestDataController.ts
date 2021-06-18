import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getOrder } from '@verkkokauppa/order-backend'
import { getPaymentRequestData } from '@verkkokauppa/payment-backend'

export class GetPaymentRequestDataController extends AbstractController {
  protected async implementation(request: Request, result: Response): Promise<any> {
    const { orderId } = request.params
    if (orderId === undefined) {
      return this.clientError(result, 'Order ID not specified')
    }

    const dto = new Data()
    try {
        const order = await getOrder({ orderId })
        dto.data = await getPaymentRequestData(order)
    } catch (error) {
        logger.error(error)
        return this.fail(result, error.toString())
    }

    return this.success<any>(result, dto.serialize())
  }
}
