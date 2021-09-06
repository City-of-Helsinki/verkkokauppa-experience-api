import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { cancelOrder } from '@verkkokauppa/order-backend'
import {
  createCart,
  createCartWithItems,
  clearCart,
} from '@verkkokauppa/cart-backend'
import { getPublicServiceConfiguration } from '@verkkokauppa/configuration-backend'
import { URL } from 'url'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
    user: yup.string().required(),
  }),
})

export class CancelController extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { orderId, user },
    } = req

    logger.debug(`Cancel Order ${orderId}`)

    const order = await cancelOrder({ orderId, user })
    await clearCart(order)
    const cart =
      order.items && order.items.length > 0
        ? await createCartWithItems(order)
        : await createCart(order)
    const cancelUrl = await CancelController.createCancelUrl(cart)
    const dto = new Data({
      order,
      cart,
      cancelUrl,
    })

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
