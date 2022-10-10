import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import * as yup from 'yup'
import {
  getAllConfigurationKeys,
  validateApiKey,
} from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    namespace: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
})

export class GetAllConfigurationKeysController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ) {
    const {
      params: { namespace },
      headers: { 'api-key': apiKey },
    } = req

    await validateApiKey({ namespace, apiKey })

    const configurationKeys = await getAllConfigurationKeys()

    return this.success(res, new Data(configurationKeys).serialize())
  }
}
