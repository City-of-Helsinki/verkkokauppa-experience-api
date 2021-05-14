import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { addItemToOrder } from '@verkkokauppa/order-backend'

export class AddItemController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { orderId } = req.params
    const { items } = req.body
    if (orderId === undefined) {
      return this.clientError(res, 'Order ID not specified')
    }
    if (items === undefined) {
      return this.clientError(res, 'Items not specified')
    }
    const dto = new Data()

    logger.debug(
      `Add items to order ${orderId}`
    )

    try {
      dto.data = await addItemToOrder({
        orderId,
        items
      })
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
