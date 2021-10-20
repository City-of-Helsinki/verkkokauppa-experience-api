import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import * as yup from 'yup'
import { createPublicServiceConfigurations } from '@verkkokauppa/configuration-backend'

const merchantSchema = yup
  .object()
  .shape({
    merchantName: yup.string(),
    merchantStreet: yup.string(),
    merchantZip: yup.string(),
    merchantCity: yup.string(),
    merchantEmail: yup.string(),
    merchantPhone: yup.string(),
    merchantUrl: yup.string(),
    merchantTermsOfServiceUrl: yup.string(),
    merchantBusinessId: yup.string(),
    ORDER_CREATED_REDIRECT_URL: yup.string(),
  })
  .from('orderCreatedRedirectUrl', 'ORDER_CREATED_REDIRECT_URL')
  .noUnknown()

const merchantKeys = Object.keys(merchantSchema.describe().fields)

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    namespace: yup.string().required(),
  }),
  body: merchantSchema,
})

export class Onboarding extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ) {
    const {
      params: { namespace },
      body,
    } = req

    const configurations = await createPublicServiceConfigurations({
      namespace,
      configurations: merchantSchema.cast(body),
    })

    const configurationMap = configurations.reduce((acc, cur) => {
      if (merchantKeys.includes(cur.configurationKey)) {
        acc[cur.configurationKey] = cur.configurationValue
      }
      return acc
    }, {} as { [key: string]: string })

    return this.created(
      res,
      new Data(merchantSchema.cast(configurationMap)).serialize()
    )
  }
}
