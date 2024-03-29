import {
  AbstractController,
  Data,
  ExperienceError,
  StatusCode,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import * as yup from 'yup'
import {
  getMerchantModels,
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

export class ListAllMerchantController extends AbstractController<
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

    const merchantsByNamespace = await getMerchantModels(namespace)

    if (merchantsByNamespace.length <= 0) {
      throw new ExperienceError({
        code: 'failed-to-find-merchants-by-namespace',
        message:
          'Failed to find list of merchants by namespace. merchantsByNamespace.length <= 0',
        responseStatus: StatusCode.NotFound,
        logLevel: 'info',
      })
    }

    return this.success(res, new Data(merchantsByNamespace).serialize())
  }
}
