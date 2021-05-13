import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { cancelOrder } from '@verkkokauppa/order-backend'

export class CancelController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { orderId } = req.params
    if (orderId === undefined) {
      return this.clientError(res, 'Order ID not specified')
    }
    const dto = new Data()
    logger.debug(`Cancel Order ${orderId}`)

    try {
      dto.data = await cancelOrder({ orderId })
    } catch (error) {
      logger.error(error)
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    return this.success<any>(res, dto.serialize())
  }
}
