import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { createProductAccounting } from '@verkkokauppa/product-backend'
import * as yup from 'yup'
import { validateApiKey } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    productId: yup.string().required(),
  }),
  body: yup.object({
    vatCode: yup.string().required(),
    companyCode: yup.string().required(),
    mainLedgerAccount: yup.string().required(),
    internalOrder: yup.string().notRequired(),
    profitCenter: yup.string().notRequired(),
    project: yup.string().notRequired(),
    operationArea: yup.string().notRequired(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
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
    const { 'api-key': apiKey, namespace } = req.headers
    const productAccounting: any = { productId, ...req.body }

    await validateApiKey({ namespace, apiKey })

    logger.debug(
      `Create product accounting for product id: ${productAccounting.productId}`
    )

    const dto = new Data(await createProductAccounting({ productAccounting }))

    return this.created<any>(res, dto.serialize())
  }
}
