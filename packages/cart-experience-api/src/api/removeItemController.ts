import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { removeItemFromCart } from '@verkkokauppa/cart-backend'

export class RemoveItemController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { cartId, productId } = req.params
    if (productId === undefined) {
      return this.clientError(res, 'Product ID not specified')
    }
    if (cartId === undefined) {
      return this.clientError(res, 'Cart ID not specified')
    }
    const dto = new Data()

    logger.debug(`Remove product ${productId} from cart ${cartId}`)

    try {
      dto.data = await removeItemFromCart({
        productId,
        cartId,
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
