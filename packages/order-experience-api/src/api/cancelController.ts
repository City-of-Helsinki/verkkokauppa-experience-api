import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { cancelOrder } from '@verkkokauppa/order-backend'
import {
  createCart,
  createCartWithItems,
  clearCart,
} from '@verkkokauppa/cart-backend'
import { getPublicServiceConfiguration } from '@verkkokauppa/configuration-backend'
import { URL } from 'url'

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
      await clearCart(order)
      const cart =
        order.items && order.items.length > 0
          ? await createCartWithItems(order)
          : await createCart(order)
      const cancelUrl = await CancelController.createCancelUrl(cart)
      dto.data = {
        order,
        cart,
        cancelUrl,
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

  private static async createCancelUrl(p: {
    namespace: string
    cartId: string
  }): Promise<string | null> {
    const { namespace, cartId } = p
    try {
      const cancelRedirectUrlConfiguration = await getPublicServiceConfiguration(
        {
          namespace: namespace,
          key: 'ORDER_CANCEL_REDIRECT_URL',
        }
      )
      const cancelUrl = new URL(
        cancelRedirectUrlConfiguration.configurationValue
      )
      cancelUrl.searchParams.append('cartId', cartId)
      return cancelUrl.toString()
    } catch (e) {
      console.error(e)
      return null
    }
  }
}
