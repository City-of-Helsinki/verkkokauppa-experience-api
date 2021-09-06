import { caseUtils } from '@verkkokauppa/core'
import type { ServiceConfiguration } from '@verkkokauppa/configuration-backend'

enum MerchantConfigurationKeys {
  MERCHANT_NAME = 'merchantName',
  MERCHANT_STREET = 'merchantStreet',
  MERCHANT_ZIP = 'merchantZip',
  MERCHANT_CITY = 'merchantCity',
  MERCHANT_EMAIL = 'merchantEmail',
  MERCHANT_PHONE = 'merchantPhone',
  MERCHANT_URL = 'merchantUrl',
}

type MerchantDetails = {
  [key in MerchantConfigurationKeys]: string
}
export const transformConfigurationToMerchant = (p: ServiceConfiguration[]) => {
  if (!p || p.length === 0 || !Array.isArray(p)) {
    return {}
  }
  return p.reduce<MerchantDetails>((acc, current) => {
    acc[
      caseUtils.toCamelCase(
        current.configurationKey
      ) as MerchantConfigurationKeys
    ] = current.configurationValue
    return acc
  }, {} as MerchantDetails)
}
