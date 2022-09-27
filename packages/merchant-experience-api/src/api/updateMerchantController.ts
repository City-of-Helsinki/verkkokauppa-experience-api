import {
  AbstractController,
  Data,
  ExperienceError,
  mergeArray,
  StatusCode,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import * as yup from 'yup'
import {
  Configuration,
  getMerchantModels,
  MerchantKeys,
  updateMerchant,
  validateApiKey,
} from '@verkkokauppa/configuration-backend'

const merchantCommonSchema = yup.object({
  merchantName: yup.string().notRequired(),
  merchantStreet: yup.string().notRequired(),
  merchantZip: yup.string().notRequired(),
  merchantCity: yup.string().notRequired(),
  merchantEmail: yup.string().notRequired(),
  merchantUrl: yup.string().notRequired(),
  merchantTermsOfServiceUrl: yup.string().notRequired(),
  merchantBusinessId: yup.string().notRequired(),
  merchantPhone: yup.string().notRequired(),
})

const merchantBackendSchema = merchantCommonSchema.noUnknown()

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    namespace: yup.string().required(),
    merchantId: yup.string().required(),
  }),
  body: merchantBackendSchema.required(),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
})

export class UpdateMerchantController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ) {
    const {
      params: { namespace, merchantId },
      body,
      headers: { 'api-key': apiKey },
    } = req

    await validateApiKey({ namespace, apiKey })
    const configurations = body as MerchantKeys

    const merchantsByNamespace = await getMerchantModels(namespace)

    const merchantToUpdate =
      merchantsByNamespace.filter(
        (merchant) => merchant.merchantId === merchantId
      )[0] || null

    if (merchantsByNamespace.length <= 0) {
      throw new ExperienceError({
        code: 'failed-to-find-merchants-by-namespace',
        message:
          'Failed to find list of merchants by namespace. merchantsByNamespace.length <= 0',
        responseStatus: StatusCode.NotFound,
        logLevel: 'info',
      })
    }

    if (merchantToUpdate == null) {
      throw new ExperienceError({
        code: 'failed-to-find-merchant-with-merchant-id',
        message:
          'Failed to find merchant with provided merchantId. merchantToUpdate == null',
        responseStatus: StatusCode.NotFound,
        logLevel: 'info',
      })
    }

    const convertedConfigurations: Configuration[] = []
    Object.entries(configurations).forEach((configuration) => {
      convertedConfigurations.push({
        key: configuration[0],
        value: configuration[1] ? configuration[1] : '',
      })
    })

    // Merging the configurations.
    merchantToUpdate.configurations = mergeArray(
      merchantToUpdate.configurations,
      convertedConfigurations,
      'key'
    )

    // Updating the merchant configurations.
    const updatedMerchant = await updateMerchant(merchantToUpdate)
    return this.success(res, new Data(updatedMerchant).serialize())
  }
}
