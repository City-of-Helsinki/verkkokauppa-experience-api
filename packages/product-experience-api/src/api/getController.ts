import { AbstractController, CombinedData, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getProduct } from '@verkkokauppa/product-backend'
import { getPrice } from '@verkkokauppa/price-backend'

export class GetController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { productId } = req.params

    if (productId === undefined) {
      return this.clientError(res, 'Product ID not specified')
    }

    const combinedData = new CombinedData()

    logger.debug(`Fetch product and price data for ${productId}`)

    try {
      combinedData.add({
        value: await getProduct({ productId }),
        identifier: 'product',
      })
    } catch (error) {
      logger.error(error)
      if (error.response.status === 404) {
        return this.notFound(res, `No product data found for ${productId}`)
      }
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    try {
      combinedData.add({
        value: await getPrice({ productId }),
        identifier: 'price',
      })
    } catch (error) {
      logger.warn(`No price data found for ${productId}`)
      logger.warn(error)
    }
    return this.success<any>(res, combinedData.serialize())
  }
}
