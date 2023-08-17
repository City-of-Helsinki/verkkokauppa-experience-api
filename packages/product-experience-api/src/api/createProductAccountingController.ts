import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import {
  createProductAccounting,
  createProductInvoicing,
} from '@verkkokauppa/product-backend'
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
    balanceProfitCenter: yup.string().required(),
    project: yup.string().notRequired(),
    operationArea: yup.string().notRequired(),
    productInvoicing: yup
      .object({
        salesOrg: yup.string().required().length(4),
        salesOffice: yup.string().required().length(4),
        material: yup.string().required().length(8),
        orderType: yup.string().required().length(4),
      })
      .notRequired()
      .default(undefined),
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
    const { productInvoicing, ...accounting } = req.body
    const productAccounting: any = { productId, ...accounting }

    await validateApiKey({ namespace, apiKey })

    logger.debug(
      `Create product accounting for product id: ${productAccounting.productId}`
    )

    const [accountingRes, invoicingRes] = await Promise.all([
      createProductAccounting({ productAccounting }),
      productInvoicing != null
        ? createProductInvoicing({
            productInvoicing: { productId, ...productInvoicing },
          })
        : undefined,
    ])

    const dto = new Data({ ...accountingRes, productInvoicing: invoicingRes })

    return this.created<any>(res, dto.serialize())
  }
}
