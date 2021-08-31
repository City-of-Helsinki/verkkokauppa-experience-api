import {
  AbstractController,
  CombinedData,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { getProduct } from '@verkkokauppa/product-backend'
import { getPrice } from '@verkkokauppa/price-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    productId: yup.string().required(),
  }),
})

export class GetController extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { productId },
    } = req

    logger.debug(`Fetch product and price data for ${productId}`)

    const combinedData = new CombinedData()

    combinedData.add({
      value: await getProduct({ productId }),
      identifier: 'product',
    })

    // FIXME do we want to fail on reject?
    combinedData.add({
      value: await getPrice({ productId }),
      identifier: 'price',
    })

    return this.success<any>(res, combinedData.serialize())
  }
}
