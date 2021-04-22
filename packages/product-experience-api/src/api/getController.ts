import { AbstractController, CombinedData, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getProduct } from '@verkkokauppa/product-backend'
import { getPrice } from '@verkkokauppa/price-backend'
import type { CommonExperienceRequest } from '@verkkokauppa/types'

export class GetController extends AbstractController {
  protected async implementation(
    req: Request<CommonExperienceRequest>,
    res: Response
  ): Promise<any> {
    const { id } = req.params
    const combinedData = new CombinedData()

    logger.debug(`Fetch product and price data for ${id}`)

    try {
      const productPromise = getProduct({ id })
      const productResult = await productPromise
      combinedData.add({ value: productResult.data, identifier: 'product' })
    } catch (error) {
      logger.error(error)
      if (error.response.status === 404) {
        return this.notFound(res, `No product data found for ${id}`)
      }
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    try {
      const pricePromise = getPrice({ id })
      const priceResult = await pricePromise
      combinedData.add({ value: priceResult.data, identifier: 'price' })
    } catch (error) {
      logger.warn(`No price data found for ${id}`)
      logger.warn(error)
    }
    return this.success<any>(res, combinedData.serialize())
  }
}
