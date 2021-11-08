import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { createProductMapping } from '@verkkokauppa/product-mapping-backend'
import * as yup from 'yup'
import { validateApiKey } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    namespace: yup.string().required(),
    namespaceEntityId: yup.string().required(),
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
      body: { namespace, namespaceEntityId },
      headers: { 'api-key': apiKey },
    } = req

    await validateApiKey({ namespace, apiKey })

    logger.debug(
      `Create product mapping for namespace: ${namespace} and product ${namespaceEntityId}`
    )

    const dto = new Data(
      await createProductMapping({ namespace, namespaceEntityId })
    )

    return this.created<any>(res, dto.serialize())
  }
}
