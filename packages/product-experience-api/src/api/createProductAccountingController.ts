import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { createProductAccounting } from '@verkkokauppa/product-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    productId: yup.string().required(),
  }),
  body: yup.object(),
})

export class CreateProductAccountingController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const { productId } = req.params
    const productAccounting: any = { productId, ...req.body }

    logger.debug(
      `Create product accounting for product id: ${productAccounting.productId}`
    )

    const dto = new Data(await createProductAccounting({ productAccounting }))

    return this.created<any>(res, dto.serialize())
  }
}
