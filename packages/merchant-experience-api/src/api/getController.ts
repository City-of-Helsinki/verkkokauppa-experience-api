import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import * as yup from 'yup'
import type { Response } from 'express'
import { getAllPublicServiceConfiguration } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    namespace: yup.string().required(),
  }),
})

const keyMap: { [key: string]: string } = {
  MERCHANT_NAME: 'merchantName',
  MERCHANT_STREET: 'merchantStreet',
  MERCHANT_ZIP: 'merchantZip',
  MERCHANT_CITY: 'merchantCity',
  MERCHANT_EMAIL: 'merchantEmail',
  MERCHANT_PHONE: 'merchantPhone',
  MERCHANT_URL: 'merchantUrl',
  MERCHANT_TERMS_OF_SERVICE_URL: 'merchantTermsOfServiceUrl',
  MERCHANT_PAYMENT_WEBHOOK_URL: 'merchantPaymentWebhookUrl',
  MERCHANT_ORDER_WEBHOOK_URL: 'merchantOrderWebhookUrl',
  MERCHANT_BUSINESS_ID: 'merchantBusinessId',
  ORDER_CREATED_REDIRECT_URL: 'orderCreatedRedirectUrl',
}

const keys = [...Object.keys(keyMap), ...Object.values(keyMap)]

export class GetController extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const { namespace } = req.params

    const configurations = await getAllPublicServiceConfiguration({ namespace })

    const configurationMap = configurations
      .filter((c) => keys.includes(c.configurationKey))
      .reduce((acc, cur) => {
        const key = keyMap[cur.configurationKey] ?? cur.configurationKey
        acc[key] = cur.configurationValue
        return acc
      }, {} as { [key: string]: string })

    const dto = new Data(configurationMap)

    return this.success(res, dto.serialize())
  }
}
