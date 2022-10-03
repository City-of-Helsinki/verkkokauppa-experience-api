import {
  AbstractController,
  Data,
  ExperienceError,
  StatusCode,
  ValidatedRequest,
} from '@verkkokauppa/core'
import * as yup from 'yup'
import type { Response } from 'express'
import {
  getAllPublicServiceConfiguration,
  getMerchantModels,
} from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    namespace: yup.string().required(),
    merchantId: yup.string().notRequired(),
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
  MERCHANT_SUBSCRIPTION_WEBHOOK_URL: 'merchantSubscriptionWebhookUrl',
  MERCHANT_BUSINESS_ID: 'merchantBusinessId',
  ORDER_CREATED_REDIRECT_URL: 'orderCreatedRedirectUrl',
  MERCHANT_REFUND_WEBHOOK_URL: 'merchantRefundWebhookUrl',
  MERCHANT_SHOP_ID: 'merchantShopId',
}

const keys = [...Object.keys(keyMap), ...Object.values(keyMap)]

export class GetController extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const { namespace, merchantId } = req.params

    const configurations = await getAllPublicServiceConfiguration({ namespace })

    const configurationMap = configurations
      .filter((c) => keys.includes(c.configurationKey))
      .reduce((acc, cur) => {
        const key = keyMap[cur.configurationKey] ?? cur.configurationKey
        acc[key] = cur.configurationValue
        return acc
      }, {} as { [key: string]: string })

    const merchants = await getMerchantModels(namespace)

    if (merchantId && merchantId !== '') {
      const merchant = merchants.find((x) => x.merchantId === merchantId)

      if (!merchant) {
        throw new ExperienceError({
          code: 'failed-to-fetch-merchant-configurations',
          message:
            'Failed to fetch - Merchant not found. merchantsByNamespace.length <= 0',
          responseStatus: StatusCode.NotFound,
          logLevel: 'info',
        })
      }

      const merchantConfigurations = merchant.configurations
        .filter((c) => keys.includes(c.key))
        .reduce((acc, cur) => {
          const key = keyMap[cur.key] ?? cur.key
          acc[key] = cur.value
          return acc
        }, {} as { [key: string]: string })

      const configurationsWithMerchantOverrides = {
        ...configurationMap,
        ...merchantConfigurations, // These values overrides data in configurationMap
      }

      const dto = new Data(configurationsWithMerchantOverrides)

      return this.success(res, dto.serialize())
    } else if (
      merchants &&
      merchants.length === 1 &&
      merchants[0]?.merchantId
    ) {
      const merchantConfigurations = merchants[0].configurations
        .filter((c) => keys.includes(c.key))
        .reduce((acc, cur) => {
          const key = keyMap[cur.key] ?? cur.key
          acc[key] = cur.value
          return acc
        }, {} as { [key: string]: string })

      const configurationsWithMerchantOverrides = {
        ...configurationMap,
        ...merchantConfigurations, // These values overrides data in configurationMap
      }

      const dto = new Data(configurationsWithMerchantOverrides)

      return this.success(res, dto.serialize())
    } else if (merchants && merchants.length > 1) {
      throw new ExperienceError({
        code: 'failed-to-fetch-merchant-configurations',
        message:
          'Failed to fetch merchant configurations - Could not resolve merchant, multiple found. merchantsByNamespace.length > 1',
        responseStatus: StatusCode.BadRequest,
        logLevel: 'info',
      })
    }

    const dto = new Data(configurationMap)

    return this.success(res, dto.serialize())
  }
}
