import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import * as yup from 'yup'
import {
  createPublicServiceConfigurations,
  validateApiKey,
} from '@verkkokauppa/configuration-backend'

const merchantCommonSchema = yup.object({
  merchantName: yup.string(),
  merchantStreet: yup.string(),
  merchantZip: yup.string(),
  merchantCity: yup.string(),
  merchantEmail: yup.string(),
  merchantPhone: yup.string(),
  merchantUrl: yup.string(),
  merchantTermsOfServiceUrl: yup.string(),
  merchantPaymentWebhookUrl: yup.string(),
  merchantOrderWebhookUrl: yup.string(),
  merchantSubscriptionWebhookUrl: yup.string(),
  merchantSubscriptionTermsOfServiceUrl: yup.string(),
  merchantBusinessId: yup.string(),
  subscriptionPriceUrl: yup.string(),
  merchantRefundWebhookUrl: yup.string(),
  merchantShopId: yup.string(),
  orderPaymentFailedRedirectUrl: yup.string(),
})

const merchantBackendSchema = merchantCommonSchema
  .shape({
    ORDER_CREATED_REDIRECT_URL: yup.string(),
    ORDER_CANCEL_REDIRECT_URL: yup.string(),
    SUBSCRIPTION_PRICE_URL: yup.string(),
  })
  .from('orderCreatedRedirectUrl', 'ORDER_CREATED_REDIRECT_URL')
  .from('orderCancelRedirectUrl', 'ORDER_CANCEL_REDIRECT_URL')
  .from('subscriptionPriceUrl', 'SUBSCRIPTION_PRICE_URL')
  .noUnknown()

const merchantFrontendSchema = merchantCommonSchema
  .shape({
    orderCreatedRedirectUrl: yup.string(),
    orderCancelRedirectUrl: yup.string(),
    subscriptionPriceUrl: yup.string(),
  })
  .from('ORDER_CREATED_REDIRECT_URL', 'orderCreatedRedirectUrl')
  .from('ORDER_CANCEL_REDIRECT_URL', 'orderCancelRedirectUrl')
  .from('SUBSCRIPTION_PRICE_URL', 'subscriptionPriceUrl')
  .noUnknown()

const merchantKeys = Object.keys(merchantBackendSchema.describe().fields)

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    namespace: yup.string().required(),
  }),
  body: merchantFrontendSchema,
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
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
      headers: { 'api-key': apiKey },
    } = req

    await validateApiKey({ namespace, apiKey })

    const configurations = await createPublicServiceConfigurations({
      namespace,
      configurations: merchantBackendSchema.cast(body),
    })

    const configurationMap = configurations.reduce((acc, cur) => {
      if (merchantKeys.includes(cur.configurationKey)) {
        acc[cur.configurationKey] = cur.configurationValue
      }
      return acc
    }, {} as { [key: string]: string })

    return this.created(
      res,
      new Data(merchantFrontendSchema.cast(configurationMap)).serialize()
    )
  }
}
