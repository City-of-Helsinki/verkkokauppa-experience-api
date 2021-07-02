import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { createProductAccounting, ProductAccounting} from '@verkkokauppa/product-backend'



export class CreateController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const productAccounting: ProductAccounting = req.body
    
    if (productAccounting.productId === undefined) {
      return this.clientError(res, 'Product id is not specified')
    }

    const dto = new Data()

    logger.debug(
      `Create product accounting for product id: ${productAccounting.productId}`
    )

    try {
      dto.data = await createProductAccounting({ productAccounting })
    } catch (error) {
      logger.error(error)
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    return this.created<any>(res, dto.serialize())
  }
}
