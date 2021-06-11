import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { clearCart, getCart } from '@verkkokauppa/cart-backend'

export class ClearController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { cartId } = req.params
    if (cartId === undefined) {
      return this.clientError(res, 'Cart ID not specified')
    }
    const dto = new Data()

    logger.debug(`Clear cart ${cartId}`)

    try {
      const existingCart = await getCart({ cartId })
      dto.data = await clearCart(existingCart)
    } catch (error) {
      logger.error(error)
      if (error.response.status === 404) {
        return this.notFound(res, `Cart ${cartId} not found`)
      }
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    return this.success<any>(res, dto.serialize())
  }
}
