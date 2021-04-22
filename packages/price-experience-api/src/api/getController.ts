import { AbstractController, CombinedData, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getPrice } from '@verkkokauppa/price-backend'
import type { CommonExperienceRequest } from '@verkkokauppa/types'

export class GetController extends AbstractController {
  protected async implementation(
    req: Request<CommonExperienceRequest>,
    res: Response
  ): Promise<any> {
    const { id } = req.params
    const combinedData = new CombinedData()

    logger.debug(`Fetch price data for ${id}`)

    const pricePromise = getPrice({ id })

    try {
      const priceResult = await pricePromise
      combinedData.add({ value: priceResult.data, identifier: 'price' })
    } catch (error) {
      logger.error(error)
      if (error.response.status === 404) {
        return this.notFound(res, `Price data for product ${id} not found`)
      }
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    return this.success<any>(res, combinedData.serialize())
  }
}
