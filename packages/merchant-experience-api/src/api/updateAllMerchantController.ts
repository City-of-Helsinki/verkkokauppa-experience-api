import {
  AbstractController,
  Data,
  ExperienceFailure,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import * as yup from 'yup'
import {
  Configuration,
  getMerchantModels,
  Merchant,
  MerchantKeys,
  updateMerchant,
  validateApiKey,
} from '@verkkokauppa/configuration-backend'
import { mergeArray } from '@verkkokauppa/core/dist/utils/arrayUtils'
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
  }),
  body: merchantBackendSchema.required(),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
})

export class UpdateAllMerchantController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ) {
    const {
      params: { namespace },
      body,
      headers: { 'api-key': apiKey },
    } = req

    await validateApiKey({ namespace, apiKey })

    const configurations = body as MerchantKeys

    const merchantsByNamespace = await getMerchantModels(namespace)

    if (merchantsByNamespace.length <= 0) {
      throw new ExperienceFailure({
        code: 'failed-to-find-merchants-by-namespace',
        message: 'Failed to find list of merchants by namespace',
        source: new Error('merchantsByNamespace.length <= 0'),
      })
    }

    const convertedConfigurations: Configuration[] = []
    Object.entries(configurations).forEach((configuration) => {
      convertedConfigurations.push({
        key: configuration[0],
        value: configuration[1] ? configuration[1] : '',
      })
    })

    const updatedMerchants: Merchant[] = []

    for (const element of merchantsByNamespace) {
      const index = merchantsByNamespace.indexOf(element)
      // Casting the element to the type Merchant.
      let merchantToUpdate = merchantsByNamespace[index] as Merchant
      // Merging the configurations.
      merchantToUpdate.configurations = mergeArray(
        element.configurations,
        convertedConfigurations,
        'key'
      )
      // Updating the merchant configurations.
      const updatedMerchant = await updateMerchant(merchantToUpdate)
      updatedMerchants.push(updatedMerchant)
    }

    return this.created(res, new Data(updatedMerchants).serialize())
  }
}
