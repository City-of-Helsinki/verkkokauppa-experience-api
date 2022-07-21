import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import * as yup from 'yup'
import type { Response } from 'express'
import { validateAdminApiKey } from '@verkkokauppa/configuration-backend'
import { getEsClient } from '../lib/elasticSearch'

const requestSchema = yup.object().shape({
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
})

export class ElasticSearchHealthController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      headers: { 'api-key': apiKey },
    } = req
    await validateAdminApiKey({ apiKey })

    const client = getEsClient()

    let response = await client.cluster.health()

    const dto = new Data(response)

    return this.success(res, dto.serialize())
  }
}
