import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getCart } from '@verkkokauppa/cart-backend'
import { getProduct } from '@verkkokauppa/product-backend'
import { getPrice } from '@verkkokauppa/price-backend'

export class GetController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { cartId } = req.params
    if (cartId === undefined) {
      return this.clientError(res, 'Cart ID not specified')
    }
    const dto = new Data()

    logger.debug(`Fetch cart ${cartId}`)

    try {
      const result = await getCart({ cartId })
      dto.data = {
        ...result,
        items: await Promise.all(
          result.items.map(async (item) => {
            const product = await getProduct(item)
            const productPrice = await getPrice(item)
            return {
              ...item,
              name: product.name,
              price: parseFloat(productPrice.price),
            }
          })
        ),
      }
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
