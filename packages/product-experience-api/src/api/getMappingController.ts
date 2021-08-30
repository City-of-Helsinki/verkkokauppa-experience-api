import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { getProductMapping } from '@verkkokauppa/product-mapping-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    productId: yup.string().required(),
  }),
})

export class GetMappingController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { productId },
    } = req

    logger.debug(`Fetch product mapping for ${productId}`)

    const dto = new Data(await getProductMapping({ productId }))

    return this.success<any>(res, dto.serialize())
  }
}
