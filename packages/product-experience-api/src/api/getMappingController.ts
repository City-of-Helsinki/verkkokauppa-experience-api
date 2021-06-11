import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getProductMapping } from '@verkkokauppa/product-mapping-backend'

export class GetMappingController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { productId } = req.params

    if (productId === undefined) {
      return this.clientError(res, 'Product ID not specified')
    }

    const dto = new Data()

    logger.debug(`Fetch product mapping for ${productId}`)

    try {
      dto.data = await getProductMapping({ productId })
    } catch (error) {
      logger.error(error)
      if (error.response.status === 404) {
        return this.notFound(res, `No product mapping found for ${productId}`)
      }
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }

    return this.success<any>(res, dto.serialize())
  }
}
