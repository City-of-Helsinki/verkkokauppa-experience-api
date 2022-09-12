import {
  AbstractController,
  Data,
  ExperienceFailure,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { createProductMapping } from '@verkkokauppa/product-mapping-backend'
import * as yup from 'yup'
import {
  validateApiKey,
  getMerchantModels,
} from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    namespace: yup.string().required(),
    namespaceEntityId: yup.string().required(),
    merchantId: yup.string(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
})

export class CreateController extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      body: { namespace, namespaceEntityId, merchantId },
      headers: { 'api-key': apiKey },
    } = req

    await validateApiKey({ namespace, apiKey })

    logger.debug(
      `Create product mapping for namespace: ${namespace} and product ${namespaceEntityId}`
    )

    let dto
    if (merchantId) {
      dto = new Data(
        await createProductMapping({ namespace, namespaceEntityId, merchantId })
      )
    } else {
      const merchants = await getMerchantModels(namespace)
      if (merchants && merchants.length === 1 && merchants[0]?.merchantId) {
        dto = new Data(
          await createProductMapping({
            namespace,
            namespaceEntityId,
            merchantId: merchants[0].merchantId,
          })
        )
      } else if (merchants && merchants.length > 1) {
        throw new ExperienceFailure({
          code: 'failed-to-create-product-mapping',
          message:
            'Failed to create product mapping - Could not resolve merchant, multiple found.',
          source: new Error('merchantsByNamespace.length > 1'),
        })
      } else {
        throw new ExperienceFailure({
          code: 'failed-to-create-product-mapping',
          message: 'Failed to create product mapping - Merchant not found.',
          source: new Error('merchantsByNamespace.length <= 0'),
        })
      }
    }

    return this.created<any>(res, dto.serialize())
  }
}
