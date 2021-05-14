import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { cancelOrder } from '@verkkokauppa/order-backend'
import { createCart, createCartWithItems } from '@verkkokauppa/cart-backend'

export class CancelController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { orderId } = req.params
    if (orderId === undefined) {
      return this.clientError(res, 'Order ID not specified')
    }
    const dto = new Data()
    logger.debug(`Cancel Order ${orderId}`)

    try {
      const order = await cancelOrder({ orderId })
      if (order.items && order.items.length > 0) {
        dto.data = {
          order,
          cart: await createCartWithItems({
            namespace: order.namespace,
            user: order.user || '',
            items: order.items,
          }),
        }
      } else {
        dto.data = {
          order,
          cart: await createCart({
            namespace: order.namespace,
            user: order.user || '',
          }),
        }
      }
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
