import {
  AbstractController,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import {
  getProductAccountingBatch,
  getProductInvoicings,
  ProductInvoicing,
} from '@verkkokauppa/product-backend'
import * as yup from 'yup'
import { validateAdminApiKey } from '@verkkokauppa/configuration-backend'
import { getProductMappingsByNamespace } from '@verkkokauppa/product-mapping-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    namespace: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
})

export class GetProductAccountingByNamespaceAdminController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const { namespace } = req.params
    const { 'api-key': apiKey } = req.headers

    await validateAdminApiKey({ apiKey })

    logger.debug(`Admin - Get product accounting for namespace: ${namespace}`)

    const productMappings = (
      await getProductMappingsByNamespace({ namespace })
    ).filter((value) => value !== null)
    const productIds = productMappings.map((mapping) => mapping.productId)

    // Fetch accounting and invoicing data in parallel
    const accounting = (await getProductAccountingBatch({ productIds })).filter(
      (value) => value !== null
    )

    let productInvoicing: (ProductInvoicing | null)[] | null = null
    try {
      productInvoicing = await getProductInvoicings({ productIds })
    } catch (e) {
      logger.debug(
        `Admin - Get invoicingAccounting for products id: ${productIds.join(
          ','
        )} returned an error`
      )
    }

    // Map each product to its corresponding accounting and invoicing by productId
    const result = productMappings.map((mapping) => {
      const productId = mapping.productId

      // Safely check if accounting and productInvoicing are defined
      const productAccounting =
        accounting?.find((acc) => acc.productId === productId) || {}
      // Check if productInvoicing is not null before attempting to use .find()
      // Check if productInvoicing is an array before attempting to use .find()
      const invoicing = Array.isArray(productInvoicing)
        ? productInvoicing.find((inv) => inv?.productId === productId) || {}
        : {}

      return {
        productMapping: mapping,
        accounting: productAccounting, // Fallback to empty object if not found
        productInvoicing: invoicing, // Fallback to empty object if not found
      }
    })

    return this.success<any>(res, result)
  }
}
