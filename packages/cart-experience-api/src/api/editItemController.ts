import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { editItemInCart, removeItemFromCart } from '@verkkokauppa/cart-backend'

export class EditItemController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { cartId, productId } = req.params
    const { quantity } = req.body
    if (productId === undefined) {
      return this.clientError(res, 'Product ID not specified')
    }
    if (cartId === undefined) {
      return this.clientError(res, 'Cart ID not specified')
    }
    if (quantity === undefined) {
      return this.clientError(res, 'Quantity not specified')
    }
    const dto = new Data()

    logger.debug(
      `Edit product ${productId} with quantity ${quantity} to cart ${cartId}`
    )

    try {
      if (quantity === 0) {
        dto.data = await removeItemFromCart({
          productId,
          cartId,
        })
      } else {
        dto.data = await editItemInCart({
          productId,
          cartId,
          quantity: quantity || 1,
        })
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
