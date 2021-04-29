import { AbstractController, CombinedData, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getPrice } from '@verkkokauppa/price-backend'

export class GetController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { productId } = req.params

    if (productId === undefined) {
      return this.clientError(res, 'Product ID not specified')
    }

    const combinedData = new CombinedData()

    logger.debug(`Fetch price data for ${productId}`)

    try {
      combinedData.add({
        value: await getPrice({ productId }),
        identifier: 'price',
      })
    } catch (error) {
      logger.error(error)
      if (error.response.status === 404) {
        return this.notFound(
          res,
          `Price data for product ${productId} not found`
        )
      }
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    return this.success<any>(res, combinedData.serialize())
  }
}
