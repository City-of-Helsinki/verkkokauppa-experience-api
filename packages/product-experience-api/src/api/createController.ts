import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { createProductMapping } from '@verkkokauppa/product-mapping-backend'

export class CreateController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { namespace, namespaceEntityId } = req.body

    if (namespace === undefined) {
      return this.clientError(res, 'Namespace is not specified')
    }
    if (namespaceEntityId === undefined) {
      return this.clientError(res, 'Namespace Entity ID is not specified')
    }

    const dto = new Data()

    logger.debug(
      `Create product mapping for namespace: ${namespace} and product ${namespaceEntityId}`
    )

    try {
      dto.data = await createProductMapping({ namespace, namespaceEntityId })
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
