import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { createOrderWithItems } from '@verkkokauppa/order-backend'
import { getCart } from '@verkkokauppa/cart-backend'
import { getPrice } from '@verkkokauppa/price-backend'
import { getProduct } from '@verkkokauppa/product-backend'

export class CartToOrder extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    return this.createFromCart(req, res)
  }

  protected async createFromCart(req: Request, res: Response): Promise<any> {
    const { cartId } = req.params
    const { customer } = req.body
    if (cartId === undefined) {
      return this.clientError(res, 'Cart ID not specified')
    }
    if (customer === undefined) {
      return this.clientError(res, 'Customer not specified')
    }

    const dto = new Data()
    logger.debug(`Create Order from cart ${cartId}`)

    try {
      const cart = await getCart({ cartId })
      dto.data = await createOrderWithItems({
        namespace: cart.namespace,
        user: cart.user || '',
        items: await Promise.all(
          cart.items.map(async (cartItem) => {
            //TODO: Remove calculation logic once totals are stored in cart
            const product = await getProduct(cartItem)
            const price = await getPrice(cartItem)
            return {
              productId: cartItem.productId,
              productName: product.name,
              quantity: cartItem.quantity,
              unit: cartItem.unit,
              rowPriceNet:
                parseFloat(price.original.netValue) * cartItem.quantity,
              rowPriceVat:
                parseFloat(price.original.vatValue) * cartItem.quantity,
              rowPriceTotal:
                parseFloat(price.original.grossValue) * cartItem.quantity,
            }
          })
        ),
      })
    } catch (error) {
      logger.error(error)
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    return this.created<any>(res, dto.serialize())
  }
}
