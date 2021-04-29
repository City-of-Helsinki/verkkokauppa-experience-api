import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { addItemToCart } from '@verkkokauppa/cart-backend'

export class AddItemController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { cartId } = req.params
    const { productId, quantity } = req.body
    if (productId === undefined) {
      return this.clientError(res, 'Product ID not specified')
    }
    if (cartId === undefined) {
      return this.clientError(res, 'Cart ID not specified')
    }
    const dto = new Data()

    logger.debug(
      `Add product ${productId} with quantity ${quantity} to cart ${cartId}`
    )

    try {
      dto.data = await addItemToCart({
        productId,
        cartId,
        quantity: quantity || 1,
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
