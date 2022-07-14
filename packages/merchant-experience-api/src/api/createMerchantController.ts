import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import * as yup from 'yup'
import {
  createMerchant,
  updateMerchant,
  Merchant,
  MerchantKeys,
  validateApiKey,
  getNamespaceModel,
} from '@verkkokauppa/configuration-backend'
import { mergeArray } from '@verkkokauppa/core/dist/utils/arrayUtils'

const merchantCommonSchema = yup.object({
  merchantName: yup.string().required(),
  merchantStreet: yup.string().required(),
  merchantZip: yup.string().required(),
  merchantCity: yup.string().required(),
  merchantEmail: yup.string().required(),
  merchantUrl: yup.string().required(),
  merchantTermsOfServiceUrl: yup.string().required(),
  merchantBusinessId: yup.string().required(),
  merchantPhone: yup.string(),
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

export class CreateMerchantController extends AbstractController<
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

    const createdMerchant: Merchant = await createMerchant({
      namespace,
      merchantKeys: body as MerchantKeys,
    })

    const namespaceModel = await getNamespaceModel(namespace)
    // Merchant configurations overrides values in namespace configurations
    createdMerchant.configurations = mergeArray(
      namespaceModel.configurations,
      createdMerchant.configurations,
      'key'
    )

    const updatedMerchant = await updateMerchant(createdMerchant)
    return this.created(res, new Data(updatedMerchant).serialize())
  }
}
