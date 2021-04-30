import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getCart } from '@verkkokauppa/cart-backend'
import { calculate } from '../service/totalsService'

export class TotalsController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { cartId } = req.params
    if (cartId === undefined) {
      return this.clientError(res, 'Cart ID not specified')
    }
    const dto = new Data()

    try {
      logger.debug(`Get cart ${cartId}`)
      const cart = await getCart({ cartId })
      logger.debug(`Calculate totals for cart ${cartId}`)
      dto.data = await calculate(cart)
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
