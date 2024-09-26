import {
  AbstractController,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import {
  getProductAccountingBatch,
  getProductInvoicings,
} from '@verkkokauppa/product-backend'
import * as yup from 'yup'
import { validateApiKey } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    productId: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
})

export class GetProductAccountingController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const { productId } = req.params
    const { 'api-key': apiKey, namespace } = req.headers

    await validateApiKey({ namespace, apiKey })

    logger.debug(`Get product accounting for product id: ${productId}`)

    const productIdList = {
      productIds: [productId],
    }

    const [accounting] = await getProductAccountingBatch(productIdList)
    try {
      const [productInvoicing] = await getProductInvoicings(productIdList)

      const dto = {
        ...accounting,
        productInvoicing: { productId, ...productInvoicing },
      }

      return this.created<any>(res, dto)
    } catch (e) {
      logger.debug(
        `Get invoicingAccounting for product id: ${productId} returned an error`
      )
      return this.created<any>(res, accounting)
    }
  }
}
