import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getCart } from '@verkkokauppa/cart-backend'

export class GetController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { cartId } = req.params
    if (cartId === undefined) {
      return this.clientError(res, 'Cart ID not specified')
    }
    const dto = new Data()

    logger.debug(`Fetch cart ${cartId}`)

    try {
      dto.data = await getCart({ cartId })
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